'use strict';

/**
 * Campaign attribution + funnel integrity.
 *
 * Dependency-free (`node --test`, no npm install): the pure normaliser is exercised
 * directly, and the wiring guarantees are asserted against source, because the checkout and
 * webhook modules construct a live Stripe client at import time.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  KNOWN_SOURCES, normalizeAttribution, normalizeSource, campaignUrl,
} = require('../services/attribution');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
/** Strip comments so assertions test CODE, not the prose documenting it. */
const stripJs = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const stripSql = (src) => src.replace(/^\s*--.*$/gm, '');
const CHECKOUT = read('routes/payments.checkout.js');
const WEBHOOK = read('routes/payments.webhook.js');
const EVENTS = read('routes/events.js');
const SERVER = read('server.js');
const MIGRATION = read('db/migrations/0006_analytics_events.sql');
const ANALYTICS = read('db/analytics.js');

const CAMPAIGN = 'beauty_world_launch';

test('each launch platform persists through normalisation', () => {
  for (const source of ['instagram', 'facebook', 'tiktok', 'pinterest', 'youtube']) {
    const a = normalizeAttribution({
      utm_source: source, utm_medium: 'organic',
      utm_campaign: CAMPAIGN, utm_content: 'creative_01',
    });
    assert.equal(a.utmSource, source, `${source} must survive`);
    assert.equal(a.utmMedium, 'organic');
    assert.equal(a.utmCampaign, CAMPAIGN);
    assert.equal(a.utmContent, 'creative_01');
    assert.equal(a.isAttributed, true);
    assert.equal(a.isKnownSource, true);
  }
  assert.deepEqual(KNOWN_SOURCES, ['instagram', 'facebook', 'tiktok', 'pinterest', 'youtube']);
});

test('utm_content persists so creatives can be compared', () => {
  for (const creative of ['creative_01', 'creative_02', 'video_01', 'story_01']) {
    assert.equal(
      normalizeAttribution({ utm_source: 'tiktok', utm_content: creative }).utmContent,
      creative,
    );
  }
  // No creative is legitimate, not an error.
  assert.equal(normalizeAttribution({ utm_source: 'tiktok' }).utmContent, null);
});

test('common link spellings resolve to one canonical platform', () => {
  assert.equal(normalizeSource('IG'), 'instagram');
  assert.equal(normalizeSource('Instagram '), 'instagram');
  assert.equal(normalizeSource('facebook.com'), 'facebook');
  assert.equal(normalizeSource('youtu.be'), 'youtube');
});

test('direct/untagged traffic is classified, never rejected', () => {
  const a = normalizeAttribution({});
  assert.equal(a.utmSource, 'direct');
  assert.equal(a.utmMedium, 'direct');
  assert.equal(a.utmCampaign, 'unknown');
  assert.equal(a.isAttributed, false);
  // Never throws for hostile or absent input.
  for (const bad of [null, undefined, { utm_source: 123 }, { utm_source: '' }]) {
    assert.doesNotThrow(() => normalizeAttribution(bad || {}));
  }
});

test('an unrecognised source is preserved rather than swallowed as direct', () => {
  const a = normalizeAttribution({ utm_source: 'reddit' });
  assert.equal(a.utmSource, 'reddit');
  assert.equal(a.isAttributed, true);
  assert.equal(a.isKnownSource, false);
});

test('attacker-controlled values are bounded', () => {
  const a = normalizeAttribution({
    utm_source: 'X'.repeat(500), utm_campaign: 'y'.repeat(500),
  });
  assert.ok(a.utmSource.length <= 64);
  assert.ok(a.utmCampaign.length <= 64);
});

test('canonical campaign URLs are well formed for every platform', () => {
  for (const source of KNOWN_SOURCES) {
    const u = campaignUrl('https://app.celebratebanner.com/products/the-beauty-of-the-world', {
      source, campaign: CAMPAIGN, content: 'creative_01',
    });
    const parsed = new URL(u);
    assert.equal(parsed.searchParams.get('utm_source'), source);
    assert.equal(parsed.searchParams.get('utm_medium'), 'organic');
    assert.equal(parsed.searchParams.get('utm_campaign'), CAMPAIGN);
    assert.equal(parsed.searchParams.get('utm_content'), 'creative_01');
  }
});

test('checkout attaches attribution to the Stripe session metadata', () => {
  assert.match(CHECKOUT, /normalizeAttribution\(body\.attribution/, 'must normalise the input');
  assert.match(CHECKOUT, /utmSource: attribution\.utmSource/, 'source must reach Stripe metadata');
  assert.match(CHECKOUT, /utmCampaign: attribution\.utmCampaign/);
  assert.match(CHECKOUT, /utmContent: attribution\.utmContent/);
});

test('checkout_started is recorded SERVER-side and deduped on the session', () => {
  assert.match(CHECKOUT, /eventType: 'checkout_started'/);
  assert.match(CHECKOUT, /dedupeKey: 'checkout_started:' \+ session\.id/);
});

test('purchase_completed comes only from the webhook and is deduped on the session', () => {
  assert.match(WEBHOOK, /eventType: 'purchase_completed'/);
  assert.match(WEBHOOK, /dedupeKey: 'purchase_completed:' \+ session\.id/,
    'a redelivered webhook must not double-count');
  // Amount/currency come from Stripe itself, so revenue equals what was charged.
  assert.match(WEBHOOK, /amountCents: session\.amount_total/);
  assert.match(WEBHOOK, /currency: session\.currency/);
});

test('the client cannot forge a purchase or a checkout start', () => {
  const code = stripJs(EVENTS);
  assert.match(code, /ACCEPTED = new Set\(\['product_view'\]\)/,
    'only product_view may come from the browser');
  assert.doesNotMatch(code, /purchase_completed/, 'the endpoint must not accept purchases');
  assert.doesNotMatch(code, /checkout_started/, 'the endpoint must not accept checkout starts');
});

test('the events endpoint is rate limited and never breaks the page', () => {
  assert.match(SERVER, /app\.post\('\/api\/events', rateLimit\('events'\), eventsHandler\)/);
  assert.match(EVENTS, /catch \(err\)/, 'a write failure must be swallowed');
  assert.match(EVENTS, /res\.status\(202\)/, 'always answers success');
});

test('the analytics report is mounted under the auth-gated admin prefix', () => {
  assert.match(SERVER, /app\.get\('\/api\/admin\/analytics', admin\.analyticsHandler\)/);
  assert.match(SERVER, /app\.use\('\/api\/admin', adminAuth\)/, 'admin prefix must stay gated');
  // And the gate must be installed BEFORE the route it protects.
  assert.ok(
    SERVER.indexOf("app.use('/api/admin', adminAuth)") < SERVER.indexOf("'/api/admin/analytics'"),
    'auth middleware must precede the analytics route',
  );
});

test('revenue is summed only from completed purchases', () => {
  assert.match(ANALYTICS, /SUM\(amount_cents\) FILTER \(WHERE event_type = 'purchase_completed'\)/);
});

test('the schema enforces idempotency and stores no payment credentials', () => {
  assert.match(MIGRATION, /dedupe_key\s+TEXT UNIQUE/, 'dedupe key must be unique');
  assert.match(ANALYTICS, /ON CONFLICT \(dedupe_key\) DO NOTHING/);
  const schema = stripSql(MIGRATION);
  for (const forbidden of ['card', 'pan', 'cvv', 'ip_address', 'user_agent', 'fingerprint', 'email']) {
    assert.doesNotMatch(schema, new RegExp(forbidden, 'i'), `${forbidden} must not be a column`);
  }
});

test('only the three funnel events are allowed by the schema', () => {
  assert.match(
    MIGRATION,
    /CHECK \(event_type IN \('product_view','checkout_started','purchase_completed'\)\)/,
  );
});
