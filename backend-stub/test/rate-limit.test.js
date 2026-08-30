/**
 * Rate limiter fail-open behavior.
 *
 * Regression: the catch block used to treat EVERY rejection as a throttle, so a
 * Redis outage (or an exhausted Upstash request quota) returned 429 on the first
 * request to /api/uploads/signed, /api/downloads/... and PATCH /api/projects/:id
 * — silently killing photo upload, autosave and post-payment delivery.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const { isLimitRejection } = require('../middleware/rate-limit');

/** Rebuild the middleware's catch logic against an injected limiter. */
function middlewareFor(limiter) {
  return async function (req, res, next) {
    try {
      await limiter.consume('1.2.3.4');
      next();
    } catch (rejection) {
      if (!isLimitRejection(rejection)) return next();
      const retryAfter = Math.max(1, Math.ceil((rejection.msBeforeNext || 1000) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: 'Too many requests. Try again in a moment.' });
    }
  };
}

function fakeRes() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

test('a genuine RateLimiterRes rejection still throttles with 429', async () => {
  const rejection = { msBeforeNext: 45000, remainingPoints: 0, consumedPoints: 201 };
  const res = fakeRes();
  let passed = false;

  await middlewareFor({ consume: () => Promise.reject(rejection) })(
    {}, res, () => { passed = true; },
  );

  assert.equal(passed, false, 'throttled request must not reach the handler');
  assert.equal(res.statusCode, 429);
  assert.equal(res.headers['retry-after'], '45');
});

test('a Redis store Error fails open instead of returning 429', async () => {
  const storeError = new Error(
    'ERR max requests limit exceeded. Limit: 500000, Usage: 500004',
  );
  const res = fakeRes();
  let passed = false;

  await middlewareFor({ consume: () => Promise.reject(storeError) })(
    {}, res, () => { passed = true; },
  );

  assert.equal(passed, true, 'a store outage must let the request through');
  assert.equal(res.statusCode, null, 'no response should be written on fail-open');
});

test('isLimitRejection discriminates rejection shapes', () => {
  assert.equal(isLimitRejection({ msBeforeNext: 1000 }), true);
  assert.equal(isLimitRejection(new Error('ECONNREFUSED')), false);
  // An Error carrying msBeforeNext is still a store failure, not a throttle.
  assert.equal(isLimitRejection(Object.assign(new Error('x'), { msBeforeNext: 5 })), false);
  assert.equal(isLimitRejection(null), false);
  assert.equal(isLimitRejection(undefined), false);
  assert.equal(isLimitRejection('nope'), false);
});
