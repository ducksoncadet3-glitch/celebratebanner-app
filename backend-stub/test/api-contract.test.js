'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Parse the actual Express mounts from server.js (source of truth for the backend surface).
const serverSrc = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
const mounts = [...serverSrc.matchAll(/app\.(get|post|patch|put|delete)\(\s*'([^']+)'/g)].map((m) => ({
  method: m[1].toUpperCase(),
  path: m[2],
}));
const has = (method, p) => mounts.some((r) => r.method === method && r.path === p);

/**
 * The backend endpoints the Next.js client (web/lib/api.ts) calls against the external API.
 * (Same-origin Next route handlers — /api/order-confirmation, /api/admin/orders/* — are NOT
 * served by this Express app and are intentionally excluded.)
 */
const CLIENT_CONTRACT = [
  { method: 'POST', path: '/api/payments/checkout' }, // api.createCheckout
  { method: 'POST', path: '/api/uploads/signed' }, //     api.requestSignedUpload
  { method: 'GET', path: '/api/projects/:id/status' }, // api.getProjectStatus / serverApi
  { method: 'PATCH', path: '/api/projects/:id' }, //       api.saveProject (autosave)
];

test('every frontend-called backend endpoint is mounted in server.js', () => {
  for (const { method, path: p } of CLIENT_CONTRACT) {
    assert.ok(has(method, p), `missing backend route: ${method} ${p}`);
  }
});

test('the previously-missing project routes are now present (regression guard)', () => {
  assert.ok(has('GET', '/api/projects/:id/status'), 'GET /api/projects/:id/status must be mounted');
  assert.ok(has('PATCH', '/api/projects/:id'), 'PATCH /api/projects/:id must be mounted');
});

test('health endpoints are mounted', () => {
  for (const p of ['/health/live', '/health/ready', '/health/dependencies']) {
    assert.ok(has('GET', p), `missing ${p}`);
  }
});

test('Stripe webhook is mounted with raw body BEFORE express.json()', () => {
  const webhookIdx = serverSrc.indexOf("app.post('/api/payments/webhook'");
  const jsonIdx = serverSrc.indexOf('express.json({'); // the actual mount, not the header comment
  assert.ok(webhookIdx > -1, 'webhook route not found');
  assert.ok(jsonIdx > -1, 'express.json not found');
  assert.ok(webhookIdx < jsonIdx, 'webhook must be mounted before express.json() for raw-body signature verification');
  assert.ok(/webhookRawParser/.test(serverSrc), 'webhook must use the raw body parser');
});

test('PATCH save body contract matches the client { renderInput, rev } shape', () => {
  // Static shape assertion against routes/projects.js (avoids loading pg/redis in unit tests).
  const src = fs.readFileSync(path.join(__dirname, '..', 'routes', 'projects.js'), 'utf8');
  assert.match(src, /renderInput:\s*z\.record/, 'SaveBody must validate renderInput as an object');
  assert.match(src, /rev:\s*z\.number\(\)\.int\(\)\.min\(0\)/, 'SaveBody must validate rev as a non-negative integer');
  assert.match(src, /saveRenderInput/, 'save handler must call the existing db saveRenderInput');
  assert.match(src, /getStatus/, 'status handler must call the existing db getStatus');
});
