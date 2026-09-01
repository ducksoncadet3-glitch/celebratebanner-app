'use strict';

/**
 * Regression: the render queue must accept the dedupe keys the app actually builds.
 *
 * Incident (proj_507a0c6b…): the Stripe webhook enqueued with
 * `dedupeKey = \`paid:${session.id}\``, which became a BullMQ custom job id. BullMQ uses ":"
 * as its Redis key separator and throws "Custom Id cannot contain :", so queue.add threw
 * for EVERY paid order. The webhook returned 5xx, Stripe retried 6 times and gave up, and
 * the customer was charged with no job, no render and no download email.
 *
 * These tests pin the exact shape the webhook produces, not a sanitised stand-in.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// utils/job-id is dependency-free on purpose: the pre-deploy suite runs `node --test`
// with no npm install, so a test must never pull in bullmq/ioredis/zod.
const { toJobId } = require('../utils/job-id');

/** BullMQ's own guard, mirrored so the test fails for the real reason. */
function bullmqWouldReject(jobId) {
  return typeof jobId === 'string' && jobId.includes(':');
}

test('a job id never contains ":" — BullMQ rejects that outright', () => {
  const sessionId = 'cs_live_a1B2c3D4e5F6g7H8i9J0kLmNoPqRsTuVwXyZ';
  const jobId = toJobId(`paid:${sessionId}`);
  assert.equal(bullmqWouldReject(jobId), false, `BullMQ would reject job id ${jobId}`);
  assert.ok(!jobId.includes(':'));
});

test('the EXACT key the Stripe webhook builds is accepted', () => {
  // Mirrors routes/payments.webhook.js: { dedupeKey: `paid:${session.id}` }
  const src = fs.readFileSync(path.join(__dirname, '..', 'routes', 'payments.webhook.js'), 'utf8');
  const m = src.match(/dedupeKey:\s*`([^`]+)`/);
  assert.ok(m, 'webhook must still pass a dedupeKey');
  const literal = m[1].replace('${session.id}', 'cs_live_ZZZ999');
  assert.equal(bullmqWouldReject(toJobId(literal)), false,
    `webhook dedupeKey "${m[1]}" still produces a job id BullMQ rejects`);
});

test('dedupe is preserved: the mapping is 1:1 and stable', () => {
  const a = toJobId('paid:cs_live_AAA');
  const b = toJobId('paid:cs_live_AAA');
  const c = toJobId('paid:cs_live_BBB');
  assert.equal(a, b, 'same session must map to the same job id (retries dedupe)');
  assert.notEqual(a, c, 'different sessions must not collide');
});

test('no dedupe key means no custom id (BullMQ assigns one)', () => {
  assert.equal(toJobId(undefined), undefined);
  assert.equal(toJobId(null), undefined);
});

test('other separators a caller might use are also normalised', () => {
  for (const key of ['paid:a:b', 'render:proj_1:v2']) {
    assert.equal(bullmqWouldReject(toJobId(key)), false, `${key} must be normalised`);
  }
});
