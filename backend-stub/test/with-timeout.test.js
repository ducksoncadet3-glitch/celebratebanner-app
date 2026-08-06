'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { withTimeout } = require('../lib/with-timeout');

const never = () => new Promise(() => {}); // never settles

test('healthy dependency: passes the result through, fast', async () => {
  const t0 = Date.now();
  const r = await withTimeout(() => Promise.resolve({ name: 'pg', ok: true, latencyMs: 1 }), 1000, 'pg');
  assert.deepEqual(r, { name: 'pg', ok: true, latencyMs: 1 });
  assert.ok(Date.now() - t0 < 200, 'should resolve immediately, not wait for the timeout');
});

test('rejected dependency: returns a structured failure with the error message', async () => {
  const r = await withTimeout(() => Promise.reject(new Error('ECONNREFUSED')), 1000, 'redis');
  assert.equal(r.ok, false);
  assert.equal(r.name, 'redis');
  assert.equal(r.error, 'ECONNREFUSED');
  assert.notEqual(r.timedOut, true); // it failed, it did not time out
});

test('dependency that never resolves: bounded timeout failure within the window', async () => {
  const ms = 120;
  const t0 = Date.now();
  const r = await withTimeout(never, ms, 'redis');
  const elapsed = Date.now() - t0;
  assert.equal(r.ok, false);
  assert.equal(r.name, 'redis');
  assert.equal(r.timedOut, true);
  assert.match(r.error, /timed out after 120ms/);
  assert.ok(elapsed >= ms - 20 && elapsed < ms + 300, `resolved in ~${ms}ms (was ${elapsed}ms)`);
});

test('multiple simultaneous failures: all bounded, none hang', async () => {
  const ms = 100;
  const t0 = Date.now();
  const results = await Promise.all([
    withTimeout(never, ms, 'pg'),
    withTimeout(never, ms, 'redis'),
    withTimeout(() => Promise.reject(new Error('boom')), ms, 's3'),
    withTimeout(() => Promise.resolve({ name: 'queue', ok: true }), ms, 'queue'),
  ]);
  const elapsed = Date.now() - t0;
  // Parallel: worst case ~one timeout window, not the sum.
  assert.ok(elapsed < ms + 300, `all settled in ~${ms}ms (was ${elapsed}ms)`);
  assert.equal(results[0].timedOut, true);
  assert.equal(results[1].timedOut, true);
  assert.equal(results[2].error, 'boom');
  assert.equal(results[3].ok, true);
  assert.ok(results.every((r) => typeof r.ok === 'boolean'));
});

test('a slow-but-successful probe still returns its real result if under the bound', async () => {
  const r = await withTimeout(
    () => new Promise((res) => setTimeout(() => res({ name: 'pg', ok: true }), 30)),
    500,
    'pg',
  );
  assert.equal(r.ok, true);
});
