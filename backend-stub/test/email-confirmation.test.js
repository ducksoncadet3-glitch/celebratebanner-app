'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// The confirmation template is a pure, dependency-free function → safe to require directly.
const confirmationTemplate = require('../email/templates/confirmation');

test('confirmation template preserves the original order-confirmation copy', () => {
  const { subject, text, html } = confirmationTemplate({ projectId: 'proj_abc' });
  assert.equal(subject, 'Your CelebrateBanner order is confirmed 🎉');
  assert.match(text, /^Thank you for your order!/);
  assert.match(text, /Your payment was received and your banner is being prepared\./);
  assert.match(text, /You will receive your download links \(and shipping updates, if applicable\) shortly\./);
  assert.match(text, /— The CelebrateBanner team$/);
  assert.match(html, /Your order is confirmed\./);
});

test('confirmation template includes the order reference only when a projectId is present', () => {
  assert.match(confirmationTemplate({ projectId: 'proj_abc' }).text, /Order reference: proj_abc/);
  assert.doesNotMatch(confirmationTemplate({}).text, /Order reference:/);
});

// ── Static wiring guards (backend has no node_modules in unit tests) ──────────

test('order-confirmation endpoint is server-to-server, session-only, and relay-proof', () => {
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(server, /app\.post\('\/api\/emails\/order-confirmation'/, 'endpoint must be mounted');

  const route = fs.readFileSync(path.join(__dirname, '..', 'routes', 'emails.js'), 'utf8');
  assert.match(route, /hasInternalSecret/, 'endpoint must require the internal shared secret');
  assert.match(route, /status\(401\)/, 'unauthorized callers must get 401');
  assert.match(route, /sessionId:\s*z\.string/, 'endpoint must accept a sessionId');
  assert.match(route, /runConfirmation/, 'endpoint must delegate to the verified/idempotent orchestrator');
  // The route must NOT accept or forward a caller-supplied recipient address.
  assert.doesNotMatch(route, /body\.email|\bemail\b\s*:/, 'endpoint must not read a recipient from the request');
});

test('confirmation is derived + idempotent server-side (verify session, atomic claim)', () => {
  const orch = fs.readFileSync(path.join(__dirname, '..', 'services', 'order-confirmation.js'), 'utf8');
  assert.match(orch, /claimConfirmation/, 'must atomically claim the send');
  assert.match(orch, /paidSessionExists/, 'must distinguish already-sent from unknown/unpaid');
  assert.match(orch, /releaseConfirmation/, 'must release the claim on transport failure');
  assert.match(orch, /claim\.email/, 'recipient must come from the stored payment row');

  const db = fs.readFileSync(path.join(__dirname, '..', 'db', 'projects.js'), 'utf8');
  assert.match(db, /confirmation_sent_at\s*=\s*NOW\(\)[\s\S]*confirmation_sent_at IS NULL/, 'claim must be an atomic conditional UPDATE');
  assert.match(db, /status\s*=\s*'succeeded'/, 'claim must require a succeeded payment');
});

test('mailer exposes the confirmation sender and only uses Postmark', () => {
  const mailer = fs.readFileSync(path.join(__dirname, '..', 'services', 'mailer.js'), 'utf8');
  assert.match(mailer, /sendConfirmationEmail/, 'mailer must export sendConfirmationEmail');
  assert.match(mailer, /api\.postmarkapp\.com/, 'mailer must send via Postmark');
  assert.doesNotMatch(mailer, /resend/i, 'mailer must not reference Resend');
});
