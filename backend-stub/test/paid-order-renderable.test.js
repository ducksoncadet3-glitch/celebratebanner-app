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
const { deserializeRenderInput } = require('../utils/render-input');

const WEBHOOK_SRC = fs.readFileSync(path.join(__dirname, '..', 'routes', 'payments.webhook.js'), 'utf8');

test('every render_input a project row can hold before a real autosave is REJECTED', () => {
  // createIfMissing seeds render_input with {"items":[]}. That is non-null, so "render_input
  // IS NOT NULL" is NOT a usable readiness signal — it still cannot be rendered.
  const unusable = [null, undefined, { items: [] }, JSON.stringify({ items: [] })];
  for (const raw of unusable) {
    assert.throws(
      () => deserializeRenderInput(raw),
      `expected ${JSON.stringify(raw)} to be rejected as unrenderable`,
    );
  }
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

test('a valid render_input still deserializes (no over-tightening)', () => {
  const valid = {
    version: 1,
    projectId: 'proj_507a0c6b0cbf446ca8f8b52a7eab86b0',
    width: 800,
    height: 1200,
    arrangement: 'classic',
    theme: {
      id: 'champion',
      fields: ['teamName'],
      palette: { bg: '#0D2B45', accent: '#4A9ECC', text: '#F5E4B0' },
    },
    bannerText: { teamName: 'Riverside Eagles' },
    photos: [{ id: 'p1', url: 'https://cdn.example.com/a.jpg', width: 1200, height: 1600 }],
    heroId: 'p1',
  };
  assert.doesNotThrow(() => deserializeRenderInput(valid));
});
