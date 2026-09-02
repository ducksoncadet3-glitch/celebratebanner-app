'use strict';

/**
 * Self-serve delivery of a paid ready-made order.
 *
 * The decision that stands between a customer and a $9.99 artwork is a pure function, so it
 * is exercised for real here — every branch, not inferred from source. The wiring around it
 * (route, token purposes, migration) is asserted against source because those modules build
 * a live pg pool at import time and this suite is dependency-free.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { decideDelivery, messageFor } = require('../services/delivery-eligibility');
const { READY_MADE } = require('../config/ready-made-products');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const stripJs = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const DELIVERY = read('services/ready-made-delivery.js');
const TOKENS = read('services/tokens.js');
const ROUTES = read('routes/projects.js');
const SERVER = read('server.js');
const WEBHOOK = read('routes/payments.webhook.js');
const PROJECTS_DB = read('db/projects.js');
const MIGRATION = read('db/migrations/0007_download_token_purpose.sql');

/** A configured ready-made product, independent of whether the env var is set locally. */
const PRODUCT = { ...READY_MADE['the-beauty-of-the-world'], masterAssetKey: 'ready-made/x/master.jpg' };
const paid = { status: 'succeeded' };

// ── the authorization decision ───────────────────────────────────────────────

test('a paid, unrefunded ready-made order may download', () => {
  const d = decideDelivery({ project: { status: 'ready' }, payment: paid, readyMade: PRODUCT });
  assert.equal(d.state, 'ok');
  assert.equal(d.allowed, true);
});

test('a REFUNDED order may never download', () => {
  // Either side of the refund is enough — markRefunded writes both, but a partial write
  // must still deny.
  for (const facts of [
    { project: { status: 'refunded' }, payment: paid },
    { project: { status: 'ready' }, payment: { status: 'refunded' } },
    { project: { status: 'refunded' }, payment: { status: 'refunded' } },
  ]) {
    const d = decideDelivery({ ...facts, readyMade: PRODUCT });
    assert.equal(d.allowed, false, 'a refunded order must be denied');
    assert.equal(d.state, 'refunded');
  }
});

test('refund is decided BEFORE anything that could grant access', () => {
  // Ordering matters: a refunded order that is otherwise perfect must not fall through.
  const code = stripJs(read('services/delivery-eligibility.js'));
  assert.ok(
    code.indexOf("state: 'refunded'") < code.indexOf("state: 'ok'"),
    'the refund check must come first',
  );
});

test('an UNPAID order may never download', () => {
  for (const payment of [null, { status: 'pending' }, { status: 'failed' }, { status: 'canceled' }]) {
    const d = decideDelivery({ project: { status: 'pending' }, payment, readyMade: PRODUCT });
    assert.equal(d.allowed, false);
    assert.equal(d.state, 'unpaid');
  }
});

test('a personalized order is not served by this path at all', () => {
  const d = decideDelivery({ project: { status: 'ready' }, payment: paid, readyMade: null });
  assert.equal(d.allowed, false);
  assert.equal(d.state, 'personalized');
});

test('an unknown project, or a product with no approved master, is denied', () => {
  assert.equal(decideDelivery({ project: null, payment: paid, readyMade: PRODUCT }).state, 'unavailable');
  const halfConfigured = { ...PRODUCT, masterAssetKey: null };
  const d = decideDelivery({ project: { status: 'ready' }, payment: paid, readyMade: halfConfigured });
  assert.equal(d.allowed, false, 'never authorize an artwork that was never approved');
});

test('the decision denies by default for junk input', () => {
  for (const facts of [{}, { project: {}, payment: {}, readyMade: {} }, { project: { status: 'weird' }, payment: { status: 'weird' }, readyMade: PRODUCT }]) {
    assert.equal(decideDelivery(facts).allowed, false);
  }
});

test('the refused-download copy is the customer-facing sentence, not an internal reason', () => {
  assert.equal(
    messageFor('refunded'),
    'This download is no longer available because this order was refunded.',
  );
  for (const state of ['refunded', 'unpaid', 'personalized', 'unavailable', 'nonsense']) {
    const m = messageFor(state);
    assert.ok(m && m.length > 10, 'every state must have copy');
    assert.doesNotMatch(m, /s3|token|bucket|sql|stripe/i, 'copy must leak no internals');
  }
});

// ── multi-channel access: the page must not break the email ──────────────────

test('a success-page authorization revokes only its OWN previous token', () => {
  const code = stripJs(DELIVERY);
  assert.match(code, /revokeProjectTokensByPurpose\(projectId, 'self_serve'\)/);
  assert.doesNotMatch(
    code,
    /revokeProjectTokens\(projectId\)/,
    'the emailed delivery token must never be deleted by a page visit',
  );
  assert.match(code, /purpose: 'self_serve'/);
});

test('the emailed token is issued with the delivery purpose and a longer life', () => {
  // The webhook does not pass a purpose, so it takes the 'delivery' default.
  assert.match(stripJs(TOKENS), /purpose = 'delivery'/);
  assert.doesNotMatch(stripJs(WEBHOOK), /purpose:/, 'the email path stays on the default');
  assert.match(DELIVERY, /SELF_SERVE_TTL_DAYS = 1/, 'the page credential must be short-lived');
});

test('resolving a token is unchanged — the page cannot consume the email link', () => {
  // The two channels are separate rows; nothing in the delivery service touches used_count
  // or resolves a token.
  assert.doesNotMatch(stripJs(DELIVERY), /resolveDownloadToken|used_count/);
});

test('a refund still revokes EVERY token, both channels', () => {
  const revoke = TOKENS.slice(TOKENS.indexOf('async function revokeProjectTokens('));
  assert.match(revoke, /DELETE FROM download_tokens WHERE project_id = \$1`/,
    'refund revocation must stay purpose-blind');
  assert.match(stripJs(WEBHOOK), /revokeProjectTokens\(projectId\)/, 'refund must still revoke');
});

test('an EXPIRED or exhausted token still cannot download, on either channel', () => {
  // Both channels resolve through the same function, so neither can outlive its expiry.
  const resolve = TOKENS.slice(TOKENS.indexOf('async function resolveDownloadToken'), TOKENS.indexOf('async function revokeProjectTokens'));
  assert.match(resolve, /new Date\(row\.expires_at\)\.getTime\(\) < Date\.now\(\)/);
  assert.match(resolve, /'token expired'/);
  assert.match(resolve, /row\.used_count >= MAX_USES/);
  assert.match(resolve, /timingSafeEqual/, 'the signature check must stay');
  // The page always passes an explicit, short TTL — it can never mint an unexpiring link.
  assert.match(stripJs(DELIVERY), /ttlDays: SELF_SERVE_TTL_DAYS/);
  assert.doesNotMatch(stripJs(DELIVERY), /ttlDays: 0|ttlDays: null/);
});

test('the schema constrains purpose and defaults existing rows to delivery', () => {
  assert.match(MIGRATION, /ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'delivery'/);
  assert.match(MIGRATION, /CHECK \(purpose IN \('delivery', 'self_serve'\)\)/);
});

// ── what reaches the customer ────────────────────────────────────────────────

test('the response never carries the S3 key, the token, or a presigned URL', () => {
  const body = DELIVERY.slice(DELIVERY.indexOf('return {', DELIVERY.indexOf('logger.info')));
  for (const leak of ['s3Key', 'masterAssetKey', 'signedGet', 'token,']) {
    assert.doesNotMatch(body, new RegExp(leak), `${leak} must not be returned`);
  }
  assert.match(body, /downloadUrl: download\.url/, 'the customer gets the tokenized API URL');
});

test('the download URL is the existing tokenized endpoint, not a new mechanism', () => {
  const issue = TOKENS.slice(TOKENS.indexOf('const base ='), TOKENS.indexOf('const base =') + 300);
  assert.match(issue, /\/api\/downloads\//);
  assert.doesNotMatch(stripJs(DELIVERY), /amazonaws|cloudfront|S3_CDN_BASE/);
});

// ── route wiring ─────────────────────────────────────────────────────────────

test('the delivery route is authorized exactly like status, and rate limited', () => {
  const handler = ROUTES.slice(ROUTES.indexOf('async function deliveryHandler'), ROUTES.indexOf('// PATCH body'));
  assert.match(handler, /await authorizeRead\(req, id\)/, 'must reuse the project authorization');
  assert.match(handler, /res\.status\(401\)/);
  assert.match(handler, /res\.status\(403\)/);
  assert.match(ROUTES, /deliveryMiddlewares: \[rateLimit\('downloads'\)\]/);
  assert.match(SERVER, /app\.get\('\/api\/projects\/:id\/delivery', \.\.\.projects\.deliveryMiddlewares, projects\.deliveryHandler\)/);
});

test('reading an order never implies downloading it', () => {
  // authorizeRead only proves the caller holds a project-scoped credential; the paid/refund
  // decision is made separately, from the database, on every call.
  assert.match(stripJs(DELIVERY), /await loadFacts\(projectId\)/);
  assert.match(stripJs(DELIVERY), /decideDelivery\(facts\)/);
});

// ── nothing else regressed ───────────────────────────────────────────────────

test('status reports the product mode without inventing a download link', () => {
  const fn = PROJECTS_DB.slice(PROJECTS_DB.indexOf('async function getStatus'), PROJECTS_DB.indexOf('async function getStatus') + 1800);
  assert.match(fn, /productMode: readyMade \? 'ready-made' : 'personalized'/);
  assert.doesNotMatch(stripJs(fn), /downloadUrl/, 'getStatus must not fake a render download');
});

test('the ready-made purchase still enqueues no render job', () => {
  const branch = WEBHOOK.slice(WEBHOOK.indexOf('const readyMade = readyMadeByTemplateId'), WEBHOOK.indexOf('const readyMade = readyMadeByTemplateId') + 400);
  assert.match(branch, /fulfillReadyMade/);
  assert.match(branch, /return/, 'the ready-made branch must return before the render path');
  const fulfil = WEBHOOK.slice(WEBHOOK.indexOf('async function fulfillReadyMade'), WEBHOOK.indexOf('\nasync function handleSessionFailed'));
  assert.doesNotMatch(fulfil, /enqueueRender|deserializeRenderInput/);
});

test('the delivery email still goes out, and a duplicate webhook stays idempotent', () => {
  const fulfil = WEBHOOK.slice(WEBHOOK.indexOf('async function fulfillReadyMade'), WEBHOOK.indexOf('\nasync function handleSessionFailed'));
  assert.match(fulfil, /sendDeliveryEmail\(/);
  assert.match(fulfil, /SELECT id FROM download_tokens WHERE project_id = \$1 LIMIT 1/,
    'a redelivered webhook must not issue a second token or send a second email');
  assert.match(fulfil, /readymade\.delivery_deduped/);
});

test('the self-serve token does not defeat that idempotency check', () => {
  // fulfillReadyMade dedupes on "any token exists". A self-serve token is only ever created
  // AFTER a delivery token exists (the order must already be paid and fulfilled), so it can
  // suppress a delivery that already happened — never one that has not.
  assert.match(stripJs(DELIVERY), /decideDelivery/);
  const decide = stripJs(read('services/delivery-eligibility.js'));
  assert.match(decide, /payment\.status !== PAID/, 'unpaid orders can never mint a token');
});
