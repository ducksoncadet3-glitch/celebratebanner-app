/**
 * CORS reconciliation tests.
 *
 * These pin middleware/cors.js to the behaviour MEASURED against production
 * (https://api.celebratebanner.com, 2026-08-30), so a rebuild from source cannot silently
 * change the policy the browser app already depends on.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { cors, allowedOrigins, ALLOWED_HEADERS, ALLOWED_METHODS } = require('../middleware/cors');

const APP_ORIGIN = 'https://app.celebratebanner.com';

/** Minimal Express-ish req/res doubles. */
function run({ method = 'GET', origin } = {}) {
  const headers = {};
  let statusCode = null;
  let ended = false;
  let nexted = false;
  const req = { method, headers: origin ? { origin } : {} };
  const res = {
    setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
    status(code) { statusCode = code; return this; },
    end() { ended = true; return this; },
  };
  cors(req, res, () => { nexted = true; });
  return { headers, statusCode, ended, nexted };
}

test('the allow-list defaults to exactly the production app origin', () => {
  delete process.env.CORS_ALLOWED_ORIGINS;
  assert.deepEqual(allowedOrigins(), [APP_ORIGIN]);
});

test('the approved app origin is allowed, with the production header and method lists', () => {
  const { headers, nexted } = run({ origin: APP_ORIGIN });
  assert.equal(headers['access-control-allow-origin'], APP_ORIGIN);
  assert.equal(headers['access-control-allow-methods'], ALLOWED_METHODS);
  assert.equal(headers['access-control-allow-headers'], ALLOWED_HEADERS);
  assert.equal(headers['vary'], 'Origin');
  assert.ok(nexted, 'non-preflight requests continue to the route');
});

test('the allow-list carries every credential channel the API accepts', () => {
  // extractProjectToken (services/project-token.js) reads Authorization then x-project-token;
  // hasInternalSecret reads x-internal-secret. All must survive the browser preflight.
  const lower = ALLOWED_HEADERS.toLowerCase();
  for (const h of ['content-type', 'authorization', 'x-internal-secret', 'x-project-token']) {
    assert.ok(lower.includes(h), `${h} must be on the allow-list`);
  }
});

test('unknown origins receive NO Access-Control-Allow-Origin (browser blocks them)', () => {
  for (const origin of [
    'https://evil.example.com',
    'https://www.celebratebanner.com',
    'https://celebratebanner.com',
    'http://localhost:3000',
    'null',
  ]) {
    const { headers } = run({ origin });
    assert.equal(headers['access-control-allow-origin'], undefined, `${origin} must not be allowed`);
    // Production emits no Vary on a denied response either — reproduced deliberately.
    assert.equal(headers['vary'], undefined);
  }
});

test('no wildcard origin and no wildcard header is ever emitted', () => {
  for (const origin of [APP_ORIGIN, 'https://evil.example.com', undefined]) {
    const { headers } = run({ origin });
    for (const [k, v] of Object.entries(headers)) {
      assert.notEqual(v, '*', `${k} must never be a wildcard`);
    }
  }
  assert.ok(!ALLOWED_HEADERS.includes('*'));
  assert.ok(!ALLOWED_METHODS.includes('*'));
});

test('credentials mode is never enabled (tokens ride Authorization, not cookies)', () => {
  const { headers } = run({ origin: APP_ORIGIN });
  assert.equal(headers['access-control-allow-credentials'], undefined);
});

test('preflight short-circuits with 204 and an empty body, on any path', () => {
  const allowed = run({ method: 'OPTIONS', origin: APP_ORIGIN });
  assert.equal(allowed.statusCode, 204);
  assert.ok(allowed.ended, 'preflight ends the response');
  assert.ok(!allowed.nexted, 'preflight never reaches the 404 handler');

  // Production returns 204 for a disallowed origin too — just without the allow headers.
  const denied = run({ method: 'OPTIONS', origin: 'https://evil.example.com' });
  assert.equal(denied.statusCode, 204);
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
});

test('a request with no Origin (server-to-server, curl) passes through untouched', () => {
  const { headers, nexted } = run({});
  assert.equal(headers['access-control-allow-origin'], undefined);
  assert.ok(nexted);
});

test('CORS_ALLOWED_ORIGINS overrides the default without loosening the model', () => {
  process.env.CORS_ALLOWED_ORIGINS = 'https://a.example.com, https://b.example.com';
  assert.deepEqual(allowedOrigins(), ['https://a.example.com', 'https://b.example.com']);
  const { headers } = run({ origin: 'https://a.example.com' });
  assert.equal(headers['access-control-allow-origin'], 'https://a.example.com');
  const denied = run({ origin: APP_ORIGIN });
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
  delete process.env.CORS_ALLOWED_ORIGINS;
});
