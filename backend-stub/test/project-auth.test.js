'use strict';

// Secret must be set BEFORE requiring the token module (read at load).
process.env.PROJECT_TOKEN_SECRET = 'test-secret-not-a-real-key-000000000000';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  signProjectToken,
  verifyProjectToken,
  extractProjectToken,
  hasInternalSecret,
} = require('../services/project-token');

const PID = 'proj_abc123';

test('valid owner: a token minted for a project verifies for that project', () => {
  const token = signProjectToken(PID);
  assert.ok(token && token.length > 20);
  assert.equal(verifyProjectToken(PID, token), true);
});

test('missing credential: empty/undefined token never verifies', () => {
  assert.equal(verifyProjectToken(PID, ''), false);
  assert.equal(verifyProjectToken(PID, undefined), false);
  assert.equal(verifyProjectToken(PID, null), false);
});

test('invalid credential: a tampered/garbage token is rejected', () => {
  const token = signProjectToken(PID);
  assert.equal(verifyProjectToken(PID, token.slice(0, -2) + 'xy'), false);
  assert.equal(verifyProjectToken(PID, 'totally-made-up'), false);
});

test('credential for another project does not authorize this project', () => {
  const tokenForA = signProjectToken('proj_AAA');
  assert.equal(verifyProjectToken('proj_BBB', tokenForA), false);
  // and each id has a distinct token
  assert.notEqual(signProjectToken('proj_AAA'), signProjectToken('proj_BBB'));
});

test('a download-style payload cannot be replayed as a project token (domain separation)', () => {
  // Same secret, different domain prefix → different signature.
  const crypto = require('node:crypto');
  const downloadStyle = crypto
    .createHmac('sha256', process.env.PROJECT_TOKEN_SECRET)
    .update(`${PID}.jpeg.body`)
    .digest('base64url');
  assert.equal(verifyProjectToken(PID, downloadStyle), false);
});

test('extractProjectToken reads Bearer and x-project-token headers', () => {
  const t = signProjectToken(PID);
  assert.equal(extractProjectToken({ headers: { authorization: `Bearer ${t}` } }), t);
  assert.equal(extractProjectToken({ headers: { 'x-project-token': t } }), t);
  assert.equal(extractProjectToken({ headers: {} }), '');
});

test('hasInternalSecret only accepts the configured shared secret', () => {
  const prev = process.env.API_SHARED_SECRET;
  process.env.API_SHARED_SECRET = 'internal-xyz';
  assert.equal(hasInternalSecret({ headers: { 'x-internal-secret': 'internal-xyz' } }), true);
  assert.equal(hasInternalSecret({ headers: { 'x-internal-secret': 'wrong' } }), false);
  assert.equal(hasInternalSecret({ headers: {} }), false);
  if (prev === undefined) delete process.env.API_SHARED_SECRET;
  else process.env.API_SHARED_SECRET = prev;
});
