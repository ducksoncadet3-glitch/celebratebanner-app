'use strict';

/**
 * What the ready-made customer actually reads.
 *
 * A ready-made product is finished artwork: nothing renders, nothing is prepared, nothing
 * ships. The personalized templates promise all three, so sending them to a ready-made buyer
 * is a false statement about their order. Templates are pure functions, so this exercises the
 * real rendered output rather than matching source.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const readyMadeDelivery = require('../email/templates/ready-made-delivery');
const readyMadeConfirmation = require('../email/templates/ready-made-confirmation');
const personalizedDelivery = require('../email/templates/delivery');
const personalizedConfirmation = require('../email/templates/confirmation');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const stripJs = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const MAILER = read('services/mailer.js');
const TOKENS = read('services/tokens.js');
const WEBHOOK = read('routes/payments.webhook.js');
const CONFIRM_SVC = read('services/order-confirmation.js');
const PROJECTS_DB = read('db/projects.js');

const LINKS = {
  downloadUrl: 'https://api.celebratebanner.com/api/downloads/proj_x/jpeg/tok.sig',
  expiresAt: '2026-09-09T17:04:43.486Z',
};
const PRODUCT = 'The Beauty of the World';

/** Language that is only true when something is produced for the customer. */
const RENDER_WORDS = [
  'rendering', 'render', 'being prepared', 'preparing your photos',
  'shipping', 'production', 'queue', 'your banner is ready',
];

const rm = readyMadeDelivery({ productName: PRODUCT, links: LINKS });
const rmConfirm = readyMadeConfirmation({
  projectId: 'proj_x', productName: PRODUCT, sessionId: 'cs_test_123',
});

// ── delivery email ───────────────────────────────────────────────────────────

test('the ready-made delivery email says the required things', () => {
  assert.equal(rm.subject, 'Your CelebrateBanner artwork is ready 🎉');
  assert.match(rm.html, /Your artwork is ready\./);
  assert.match(rm.html, /Thank you for your purchase/);
  assert.match(rm.html, /is ready to download/);
  assert.match(rm.html, /Download Your Artwork/);
  assert.match(rm.text, /Your artwork is ready\./);
  assert.match(rm.text, /Thank you for your purchase\./);
});

test('it claims no rendering, preparation, shipping or queue', () => {
  for (const body of [rm.html, rm.text, rm.subject]) {
    for (const word of RENDER_WORDS) {
      assert.doesNotMatch(body, new RegExp(word, 'i'), `ready-made copy must not say "${word}"`);
    }
  }
});

test('the product name comes from the registry, never hard-coded', () => {
  const src = read('email/templates/ready-made-delivery.js');
  assert.doesNotMatch(src, /Beauty of the World/, 'a second ready-made product must need no new template');
  const other = readyMadeDelivery({ productName: 'Something Else', links: LINKS });
  assert.match(other.html, /Something Else/);
  assert.match(other.text, /Something Else/);
  // And a missing name degrades to a sentence that still reads correctly.
  const none = readyMadeDelivery({ links: LINKS });
  assert.match(none.text, /is ready to download/);
  assert.doesNotMatch(none.text, /undefined|null/);
});

test('the secure link, its expiry and the cross-sell are all preserved', () => {
  assert.match(rm.html, /api\/downloads\/proj_x\/jpeg/);
  assert.match(rm.html, /expires/i);
  assert.match(rm.html, /September 9, 2026/);
  assert.match(rm.html, /Discover More CelebrateBanner Designs/);
  assert.match(rm.html, /https:\/\/www\.celebratebanner\.com\//);
  assert.match(rm.text, /https:\/\/www\.celebratebanner\.com\//);
});

test('the product name is escaped, so a name can never inject markup', () => {
  const evil = readyMadeDelivery({ productName: '<script>x</script>', links: LINKS });
  assert.doesNotMatch(evil.html, /<script>/);
  assert.match(evil.html, /&lt;script&gt;/);
});

// ── confirmation email ───────────────────────────────────────────────────────

test('the ready-made confirmation is accurate about a digital order', () => {
  assert.match(rmConfirm.html, /Your order is confirmed\./);
  assert.match(rmConfirm.html, /Thank you for your purchase/);
  assert.match(rmConfirm.html, /your artwork is ready for download/i);
  assert.match(rmConfirm.text, /Your order is confirmed\./);
});

test('it does not promise rendering, preparation, shipping or a queue', () => {
  for (const body of [rmConfirm.html, rmConfirm.text]) {
    for (const word of RENDER_WORDS) {
      assert.doesNotMatch(body, new RegExp(word, 'i'), `confirmation must not say "${word}"`);
    }
  }
});

test('it points the customer at the page that actually has the button', () => {
  assert.match(rmConfirm.html, /\/success\?session_id=cs_test_123&project_id=proj_x/);
  assert.match(rmConfirm.html, /Download Your Artwork/);
  // Without the paid session id there is no authorized page to link, so it links none.
  const noSession = readyMadeConfirmation({ projectId: 'proj_x', productName: PRODUCT });
  assert.doesNotMatch(noSession.html, /\/success/);
  assert.doesNotMatch(noSession.html, /undefined/);
});

// ── personalized copy is untouched ───────────────────────────────────────────

test('the personalized delivery email is byte-for-byte what it was', () => {
  const p = personalizedDelivery({ projectId: 'proj_y', links: LINKS });
  assert.equal(p.subject, '🎉 Your CelebrateBanner is ready');
  assert.match(p.html, /Your banner is ready\./);
  assert.match(p.html, /finished rendering your CelebrateBanner/);
});

test('the personalized confirmation email is byte-for-byte what it was', () => {
  const p = personalizedConfirmation({ projectId: 'proj_y' });
  assert.equal(p.subject, 'Your CelebrateBanner order is confirmed 🎉');
  assert.match(p.html, /your banner is being prepared/);
  assert.match(p.html, /shipping updates/);
});

// ── routing: the right copy reaches the right order ──────────────────────────

test('the mailer chooses copy from the ready-made registry, not a flag it is handed', () => {
  const code = stripJs(MAILER);
  assert.match(code, /readyMadeByTemplateId\(templateId\)/);
  // Both senders branch; neither trusts a caller-supplied "isReadyMade".
  assert.match(code, /readyMade\s*\n?\s*\?\s*readyMadeDeliveryTemplate/);
  assert.match(code, /readyMade\s*\n?\s*\?\s*readyMadeConfirmationTemplate/);
  assert.doesNotMatch(code, /isReadyMade\s*[,)]/);
});

test('the webhook tags the delivery email with the ready-made slug', () => {
  const fulfil = WEBHOOK.slice(
    WEBHOOK.indexOf('async function fulfillReadyMade'),
    WEBHOOK.indexOf('\nasync function handleSessionFailed'),
  );
  assert.match(fulfil, /templateId: readyMade\.slug/);
});

test('the confirmation claim reads the product slug atomically with the claim', () => {
  const fn = PROJECTS_DB.slice(PROJECTS_DB.indexOf('async function claimConfirmation'));
  assert.match(fn, /WITH claimed AS \(/, 'the claim must stay a single atomic statement');
  assert.match(fn, /confirmation_sent_at IS NULL/, 'idempotency must be unchanged');
  assert.match(fn, /status = 'succeeded'/, 'only a paid session may be claimed');
  assert.match(fn, /templateId: row\.template_id/);
  assert.match(stripJs(CONFIRM_SVC), /templateId: claim\.templateId/);
});

// ── the refunded download message ────────────────────────────────────────────

test('a refunded order is told why, in customer language', () => {
  const resolve = TOKENS.slice(
    TOKENS.indexOf('async function resolveDownloadToken'),
    TOKENS.indexOf('async function projectWasRefunded'),
  );
  assert.match(
    resolve,
    /This download is no longer available because this order was refunded\./,
  );
  assert.match(resolve, /status: 410/);
});

test('the refund explanation happens only AFTER the signature check', () => {
  const resolve = TOKENS.slice(TOKENS.indexOf('async function resolveDownloadToken'));
  const sigAt = resolve.indexOf('invalid signature');
  const refundAt = resolve.indexOf('projectWasRefunded');
  assert.ok(sigAt > -1 && refundAt > sigAt,
    'a forged token must be rejected before anything about the order is revealed');
});

test('an unknown or forged token still gets the generic answer', () => {
  const resolve = TOKENS.slice(TOKENS.indexOf('async function resolveDownloadToken'));
  assert.match(resolve, /'token revoked or not issued'/, 'the generic 404 must remain');
  assert.match(resolve, /'invalid signature'/);
  assert.match(resolve, /'malformed token'/);
});

test('the explanation leaks no internals', () => {
  const fn = TOKENS.slice(TOKENS.indexOf('async function projectWasRefunded'), TOKENS.indexOf('async function revokeProjectTokens'));
  // It selects a literal 1 — no amount, no payment id, no key, no token state.
  assert.match(fn, /SELECT 1 AS refunded/);
  for (const leak of ['s3_key', 'token_hash', 'amount', 'stripe_', 'customer_email']) {
    assert.doesNotMatch(fn, new RegExp(leak), `${leak} must not be read here`);
  }
  assert.match(fn, /return false/, 'a lookup failure must not change the outcome');
});

test('refund revocation itself is unchanged', () => {
  const revoke = TOKENS.slice(TOKENS.indexOf('async function revokeProjectTokens('));
  assert.match(revoke, /DELETE FROM download_tokens WHERE project_id = \$1`/);
  assert.match(stripJs(WEBHOOK), /revokeProjectTokens\(projectId\)/);
});

test('expiry and the usage cap are unchanged', () => {
  const resolve = TOKENS.slice(TOKENS.indexOf('async function resolveDownloadToken'));
  assert.match(resolve, /'token expired'/);
  assert.match(resolve, /row\.used_count >= MAX_USES/);
  assert.match(resolve, /timingSafeEqual/);
});
