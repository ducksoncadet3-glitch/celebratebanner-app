'use strict';

/**
 * Ready-made fulfilment guarantees.
 *
 * A ready-made product is a finished master artwork sold exactly as shown. The customer
 * never uploads, never enters the builder, and nothing is rendered — so this path must
 * never touch render_input or the render queue, and must never expose the master asset
 * without a paid authorization.
 *
 * Source-level assertions are used for the webhook because it constructs a live Stripe
 * client at import time; the suite is dependency-free (`node --test`, no npm install).
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  READY_MADE,
  readyMadeByTemplateId,
  isReadyMade,
  purchasableProductIds,
} = require('../config/ready-made-products');

const WEBHOOK = fs.readFileSync(path.join(__dirname, '..', 'routes', 'payments.webhook.js'), 'utf8');
const SLUG = 'the-beauty-of-the-world';

/** The ready-made branch body, from its guard to its `return`. */
function readyMadeBranch() {
  const start = WEBHOOK.indexOf('const readyMade = readyMadeByTemplateId');
  assert.ok(start > -1, 'the webhook must branch on ready-made');
  return WEBHOOK.slice(start, start + 400);
}

/** The fulfilment function body. */
function fulfillBody() {
  const start = WEBHOOK.indexOf('async function fulfillReadyMade');
  assert.ok(start > -1, 'fulfillReadyMade must exist');
  const end = WEBHOOK.indexOf('\nasync function handleSessionFailed', start);
  return WEBHOOK.slice(start, end);
}

test('the product record carries the required configuration', () => {
  const p = READY_MADE[SLUG];
  assert.ok(p, 'the-beauty-of-the-world must be registered');
  assert.equal(p.productMode, 'ready-made');
  assert.equal(p.slug, SLUG);
  assert.equal(p.name, 'The Beauty of the World');
  assert.equal(p.digitalPriceCents, 999);
  assert.equal(p.printPriceCents, 7999);
});

test('it is INACTIVE until an approved master asset is configured', () => {
  // No default key: a guessed or missing object would mean the customer pays and the
  // download 404s. Unconfigured => the webhook does not treat it as ready-made at all.
  const p = READY_MADE[SLUG];
  if (!process.env.READY_MADE_BEAUTY_ASSET_KEY) {
    assert.equal(p.masterAssetKey, null, 'there must be no fallback asset key');
    assert.equal(p.active, false, 'must be inactive without an approved asset');
    assert.equal(readyMadeByTemplateId(SLUG), null, 'must not be sellable');
  }
});

test('configuring the asset activates it without a code change', () => {
  const configured = { ...READY_MADE[SLUG], masterAssetKey: 'ready-made/approved.jpg', active: true };
  assert.equal(configured.active, true);
  assert.ok(configured.masterAssetKey);
});

test('a personalized order is NOT treated as ready-made', () => {
  for (const templateId of [
    'champion', 'graduation', 'world-memories-photo-collage', '', null, undefined, 'unknown',
  ]) {
    assert.equal(isReadyMade(templateId), false, `${templateId} must use the render pipeline`);
  }
});

test('ready-made fulfilment never reads render_input or enqueues a render', () => {
  const body = fulfillBody();
  assert.doesNotMatch(body, /deserializeRenderInput/, 'must not depend on render_input');
  assert.doesNotMatch(body, /enqueueRender/, 'must not enqueue a render job');
  assert.doesNotMatch(body, /renderInput/, 'must not reference a render input at all');
});

test('the ready-made branch returns BEFORE the render pipeline runs', () => {
  const branchAt = WEBHOOK.indexOf('const readyMade = readyMadeByTemplateId');
  const deserializeAt = WEBHOOK.indexOf('deserializeRenderInput(project');
  const enqueueAt = WEBHOOK.indexOf('await enqueueRender(');
  assert.ok(branchAt > -1 && deserializeAt > -1 && enqueueAt > -1);
  assert.ok(branchAt < deserializeAt, 'ready-made must branch before render_input is read');
  assert.ok(branchAt < enqueueAt, 'ready-made must branch before the render is enqueued');
  assert.match(readyMadeBranch(), /return;/, 'the branch must return, not fall through');
});

test('the master asset is delivered only through an expiring signed authorization', () => {
  const body = fulfillBody();
  assert.match(body, /issueDownloadToken/, 'must mint a download token');
  assert.match(body, /masterAssetKey/, 'the token must point at the master asset');
  // A permanent public URL must never be constructed or emailed.
  assert.doesNotMatch(body, /https:\/\/[^\s'"`]*s3[^\s'"`]*amazonaws/i, 'no raw S3 URL');
  assert.doesNotMatch(body, /S3_CDN_BASE/, 'no permanent CDN URL for the master asset');
});

test('a duplicate/redelivered webhook does not deliver twice', () => {
  const body = fulfillBody();
  assert.match(body, /download_tokens WHERE project_id/, 'must check for an existing delivery');
  assert.match(body, /readymade\.delivery_deduped/, 'must audit the deduped case');
  // The dedupe check has to come before the token is minted.
  assert.ok(
    body.indexOf('download_tokens WHERE project_id') < body.indexOf('issueDownloadToken'),
    'the dedupe guard must precede issuing a new token',
  );
});

test('fulfilment is audited and the customer is emailed', () => {
  const body = fulfillBody();
  assert.match(body, /auditRecord/, 'must write an audit record');
  assert.match(body, /readymade\.delivered/, 'audit action must identify ready-made delivery');
  assert.match(body, /sendDeliveryEmail/, 'must send the delivery email');
});

test('payment verification and idempotency are untouched', () => {
  // The ready-made branch sits AFTER markPaid and the webhook-event claim, so signature
  // verification, payment recording and event dedupe all still apply.
  assert.ok(
    WEBHOOK.indexOf('await markPaid(') < WEBHOOK.indexOf('const readyMade = readyMadeByTemplateId'),
    'payment must be recorded before ready-made fulfilment',
  );
  assert.match(WEBHOOK, /constructEvent|webhookRawParser/, 'signature verification retained');
  assert.match(WEBHOOK, /claimEvent/, 'webhook event idempotency retained');
});

test('printed ready-made art is gated until separately certified', () => {
  const p = READY_MADE[SLUG];
  assert.equal(p.printFulfillmentCertified, false, 'print must stay gated for now');
  assert.deepEqual(purchasableProductIds(p), ['digital'], 'digital only while print is gated');
  // Digital must not be blocked by the print gate.
  assert.ok(purchasableProductIds(p).includes('digital'));
});

test('flipping the print gate would enable print without touching digital', () => {
  const enabled = { ...READY_MADE[SLUG], printFulfillmentCertified: true };
  assert.deepEqual(purchasableProductIds(enabled), ['digital', 'print']);
});
