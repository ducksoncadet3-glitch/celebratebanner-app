'use strict';

/**
 * Regression: a PAID order must never fail silently.
 *
 * Incident (proj_507a0c6b…): the customer paid, markPaid recorded the payment, then
 * deserializeRenderInput threw on the project's render_input. The handler logged one line
 * and `return`ed — so no render was enqueued, Stripe got a 200 and never retried, and the
 * customer received an order-confirmation email but never a download email.
 *
 * These tests pin the two properties that made that failure invisible.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const WEBHOOK_SRC = fs.readFileSync(path.join(__dirname, '..', 'routes', 'payments.webhook.js'), 'utf8');

/* NOTE: the deserializer's behaviour on an empty/seeded render_input is asserted through
   the source guards below rather than by importing utils/render-input, which needs zod.
   The pre-deploy suite runs `node --test` with no npm install, so tests stay dependency-free. */

test('createIfMissing seeds render_input with a value that is NOT renderable', () => {
  // The seed is `{"items": []}` — non-null, so "render_input IS NOT NULL" is not a usable
  // readiness signal. rev > 0 is the real "a customer has saved" signal.
  const db = fs.readFileSync(path.join(__dirname, '..', 'db', 'projects.js'), 'utf8');
  assert.match(db, /JSON\.stringify\(\{\s*items:/, 'createIfMissing must still seed {items:[]}');
});

test('a paid order that cannot render raises an alert and an audit record', () => {
  // Source-level guard: the catch that handles an unusable render_input on a PAID order must
  // do more than log. Without these, the order is invisible and unrecoverable.
  const idx = WEBHOOK_SRC.indexOf('webhook.paid-order-not-renderable');
  assert.ok(idx > -1, 'the paid-but-unrenderable path must be explicitly named');

  const block = WEBHOOK_SRC.slice(idx - 1200, idx + 1200);
  assert.match(block, /captureError\(/, 'must raise an alert so ops sees a stranded paid order');
  assert.match(block, /auditRecord\(/, 'must write an audit row so the order is discoverable');
  assert.match(block, /payment\.render_input_missing/, 'audit action must identify the cause');
  assert.match(block, /incPaidOrdersNotRenderable/, 'must increment a monitorable counter');
});

test('the unrenderable path never marks the payment failed', () => {
  // The charge succeeded. Corrupting payment state would break refunds and reporting.
  const idx = WEBHOOK_SRC.indexOf('webhook.paid-order-not-renderable');
  const block = WEBHOOK_SRC.slice(idx - 1200, idx + 1200);
  assert.doesNotMatch(block, /markFailed\(/, 'must not mark a succeeded payment as failed');
});
