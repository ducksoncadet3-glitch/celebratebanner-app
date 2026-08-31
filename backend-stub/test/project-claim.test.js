'use strict';

/**
 * Claim-on-first-write regression tests.
 *
 * The builder uploads photos BEFORE its first autosave (create-flow.tsx gates the
 * autosave effect on state.photos.length > 0), and POST /api/uploads/signed pre-creates
 * the projects row because uploads.project_id is NOT NULL REFERENCES projects(id).
 *
 * saveHandler used to reject any save for a project whose row already existed, so on the
 * real customer path EVERY first save returned 403. The design never reached the server,
 * and a paid HD render — which reads render_input from the database — had nothing to draw.
 *
 * Reproduced against production 2026-08-31:
 *   PATCH on a fresh id                          -> 200, token minted
 *   POST /api/uploads/signed then PATCH same id  -> 403 forbidden
 *
 * A project is unclaimed until it has been SAVED, which is `rev === 0` — NOT
 * "render_input IS NULL". createIfMissing seeds render_input with {"items":[]}, so that
 * column is non-null from creation; rev is NOT NULL DEFAULT 0 and is incremented by every
 * saveRenderInput. Once rev > 0 a valid token is required, so the trust-on-first-use
 * window is unchanged.
 */

process.env.PROJECT_TOKEN_SECRET = 'test-secret-not-a-real-key-000000000000';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// ── Stub the database before routes/projects.js loads it ────────────────────
const state = { row: null, saved: null };

function stub(relPath, exports) {
  const full = require.resolve(path.join(__dirname, '..', relPath));
  require.cache[full] = { id: full, filename: full, loaded: true, exports };
}

// The rest of this suite is dependency-free (backend-stub node_modules are not installed),
// so intercept the third-party packages routes/projects.js pulls in. None participate in
// the behaviour under test: saveHandler is called directly with a pre-validated req.valid,
// so validate() and the rate limiter never run.
const Module = require('node:module');
const chain = () => new Proxy(function () {}, { get: () => chain(), apply: () => chain() });
const BARE = {
  zod: { z: chain() },
  pino: chain(),
  'rate-limiter-flexible': chain(),
  ioredis: chain(),
};
const realLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (Object.prototype.hasOwnProperty.call(BARE, request)) return BARE[request];
  return realLoad.call(this, request, parent, isMain);
};

stub('db/projects', {
  getById: async () => state.row,
  createIfMissing: async () => {
    if (!state.row) state.row = { id: 'proj_test01', rev: 0, render_input: { items: [] } };
  },
  saveRenderInput: async ({ projectId, renderInput, rev }) => {
    state.saved = { projectId, renderInput, rev };
    state.row = { id: projectId, rev: rev + 1, render_input: renderInput };
    return rev + 1;
  },
  getStatus: async () => ({ projectId: 'proj_test01', status: 'pending' }),
});
stub('db/index', { one: async () => null, query: async () => ({ rows: [] }) });

const { saveHandler } = require('../routes/projects');
const { signProjectToken } = require('../services/project-token');

const PID = 'proj_test01';
const RENDER_INPUT = { theme: { id: 'graduation' }, photos: [{ id: 'p1' }] };

function call({ row, headers = {} }) {
  state.row = row;
  state.saved = null;
  const req = { params: { id: PID }, headers, valid: { renderInput: RENDER_INPUT, rev: 0 } };
  let status = 200;
  let body = null;
  const res = {
    status(c) { status = c; return this; },
    json(b) { body = b; return this; },
  };
  return saveHandler(req, res).then(() => ({ status, body, saved: state.saved }));
}

test('THE DEFECT: a row pre-created by the upload endpoint can still be claimed', async () => {
  // uploads/signed created the row; nothing has ever been saved to it.
  const r = await call({ row: { id: PID, rev: 0, render_input: { items: [] } } });
  assert.equal(r.status, 200, 'the first autosave after a photo upload must succeed');
  assert.ok(r.body.projectToken, 'the owner receives a project token');
  assert.deepEqual(r.saved.renderInput, RENDER_INPUT, 'the design is persisted');
});

test('a project that has never been touched at all is still claimable', async () => {
  const r = await call({ row: null });
  assert.equal(r.status, 200);
  assert.ok(r.body.projectToken);
});

test('once a design exists, an anonymous write is refused', async () => {
  const r = await call({ row: { id: PID, rev: 3, render_input: { theme: { id: 'graduation' } } } });
  assert.equal(r.status, 403, 'a saved project is claimed and requires the token');
  assert.equal(r.saved, null, 'nothing is written');
});

test('the owner’s token still authorizes writes to a saved project', async () => {
  const r = await call({
    row: { id: PID, rev: 3, render_input: { theme: { id: 'graduation' } } },
    headers: { authorization: `Bearer ${signProjectToken(PID)}` },
  });
  assert.equal(r.status, 200);
  assert.deepEqual(r.saved.renderInput, RENDER_INPUT);
});

test('a forged token is refused even while the project is unclaimed', async () => {
  const r = await call({
    row: { id: PID, rev: 0, render_input: { items: [] } },
    headers: { authorization: 'Bearer forged.value' },
  });
  assert.equal(r.status, 403, 'presenting a bad token is never treated as anonymous');
  assert.equal(r.saved, null);
});

test('a token for another project does not claim this one', async () => {
  const r = await call({
    row: { id: PID, rev: 0, render_input: { items: [] } },
    headers: { 'x-project-token': signProjectToken('proj_someoneelse') },
  });
  assert.equal(r.status, 403);
  assert.equal(r.saved, null);
});

test('a non-null render_input does NOT by itself mean claimed', async () => {
  // This is the trap the first fix fell into: createIfMissing seeds render_input, so a
  // freshly uploaded-to project has a non-null render_input and rev 0. It is unclaimed.
  const r = await call({ row: { id: PID, rev: 0, render_input: { items: [] } } });
  assert.equal(r.status, 200, 'seeded render_input with rev 0 must remain claimable');
});

test('rev is the claim signal at the boundary', async () => {
  assert.equal((await call({ row: { id: PID, rev: 0, render_input: { items: [] } } })).status, 200);
  assert.equal((await call({ row: { id: PID, rev: 1, render_input: { items: [] } } })).status, 403);
});
