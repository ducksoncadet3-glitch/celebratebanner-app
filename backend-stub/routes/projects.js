/**
 * Project status + autosave routes — authorized so one customer cannot read or overwrite
 * another customer's project.
 *
 *   GET   /api/projects/:id/status   — poll render/payment status (used by /success)
 *   PATCH /api/projects/:id          — autosave the canonical RenderInput (versioned)
 *
 * Authorization (no customer accounts — see services/project-token.js):
 *   • Project access token (HMAC, `x-project-token` / Bearer) — the primary credential the
 *     owning browser holds. Required for writes; accepted for reads.
 *   • Stripe session_id (?session_id=) that maps to this project in `payments` — a read-only
 *     capability the paying customer holds on the /success page (survives the Stripe redirect).
 *   • Internal shared secret (`x-internal-secret`) — for trusted server-to-server reads
 *     (serverApi()); never exposed to the browser.
 *
 * Writes use trust-on-first-use: the first autosave for an UNCLAIMED project creates it and
 * mints the owner's token; after that, writes require the token. Behavior (validation, rev
 * optimistic-concurrency, 404/409) comes from the existing db/projects functions.
 */

const { z } = require('zod');
const { getStatus, saveRenderInput, createIfMissing, getById } = require('../db/projects');
const { one } = require('../db/index');
const { validate } = require('../middleware/validate');
const { rateLimit } = require('../middleware/rate-limit');
const { logger } = require('../services/logger');
const {
  signProjectToken,
  verifyProjectToken,
  extractProjectToken,
  hasInternalSecret,
} = require('../services/project-token');

// Does this Stripe checkout session belong to this project? (read-only capability)
async function sessionOwnsProject(sessionId, projectId) {
  try {
    const row = await one(
      'SELECT 1 AS ok FROM payments WHERE stripe_session_id = $1 AND project_id = $2 LIMIT 1',
      [sessionId, projectId],
    );
    return !!row;
  } catch (err) {
    logger.warn({ err: err.message }, 'projects.session-check-failed');
    return false;
  }
}

// Read authorization → 'ok' | 'invalid' | 'none'. Never depends on whether the project exists.
async function authorizeRead(req, projectId) {
  if (hasInternalSecret(req)) return 'ok';
  const token = extractProjectToken(req);
  if (token) return verifyProjectToken(projectId, token) ? 'ok' : 'invalid';
  const sessionId = req.query.session_id ? String(req.query.session_id) : '';
  if (sessionId) return (await sessionOwnsProject(sessionId, projectId)) ? 'ok' : 'invalid';
  return 'none';
}

// ── GET /api/projects/:id/status ─────────────────────────────────────────────
async function statusHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const id = req.params.id;
  const decision = await authorizeRead(req, id);
  if (decision === 'none') return res.status(401).json({ error: 'authorization required' });
  if (decision === 'invalid') return res.status(403).json({ error: 'forbidden' });
  try {
    res.status(200).json(await getStatus(id));
  } catch (err) {
    logger.error({ err: err.message, projectId: id }, 'projects.status-failed');
    res.status(500).json({ error: 'failed' });
  }
}

// PATCH body — mirrors web/lib/api.ts saveProject({ renderInput, rev }).
const SaveBody = z.object({
  renderInput: z.record(z.unknown()),
  rev: z.number().int().min(0),
});

function templateIdFrom(renderInput) {
  const theme = renderInput && renderInput.theme;
  return (theme && typeof theme === 'object' && typeof theme.id === 'string' && theme.id) || 'graduation';
}

async function persist(res, id, renderInput, rev) {
  try {
    const newRev = await saveRenderInput({ projectId: id, renderInput, rev });
    res.status(200).json({ rev: newRev, projectToken: signProjectToken(id) });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'project not found' });
    if (err.status === 409) return res.status(409).json({ error: 'stale rev', currentRev: err.currentRev });
    logger.error({ err: err.message, projectId: id }, 'projects.save-failed');
    res.status(500).json({ error: 'failed' });
  }
}

// ── PATCH /api/projects/:id ──────────────────────────────────────────────────
async function saveHandler(req, res) {
  const id = req.params.id;
  const { renderInput, rev } = req.valid;
  const token = extractProjectToken(req);

  // 1) Owner (valid token) or trusted internal caller → authorized write.
  if (hasInternalSecret(req) || (token && verifyProjectToken(id, token))) {
    await createIfMissing({ projectId: id, templateId: templateIdFrom(renderInput), renderType: 'standard', customerEmail: null, items: [] });
    return persist(res, id, renderInput, rev);
  }

  // 2) A token was presented but doesn't authorize this project → forbidden.
  if (token) return res.status(403).json({ error: 'forbidden' });

  // 3) No credential: allow claim-on-first-write for a project nobody has saved yet.
  //
  //    "Row exists" must NOT be read as "someone owns this". POST /api/uploads/signed
  //    pre-creates the projects row (uploads.project_id is NOT NULL REFERENCES
  //    projects), and the builder uploads photos BEFORE its first autosave — the
  //    autosave effect is gated on state.photos.length > 0. So on the real customer
  //    path the row always exists by the time the first save arrives, and treating
  //    that as "claimed" rejected every first save with 403. The design then never
  //    reached the server, and a paid HD render had no render_input to draw.
  //
  //    "Unclaimed" is `rev === 0`. It is NOT "render_input IS NULL": createIfMissing
  //    seeds render_input with {"items":[]}, so that column is non-null from the moment
  //    the row is created. rev is BIGINT NOT NULL DEFAULT 0 and saveRenderInput does
  //    rev = rev + 1 on every save, so rev > 0 means exactly "a customer has already
  //    saved a design here", which is precisely when a token must be required.
  const existing = await getById(id).catch(() => null);
  if (existing && Number(existing.rev) > 0) return res.status(403).json({ error: 'forbidden' });
  await createIfMissing({ projectId: id, templateId: templateIdFrom(renderInput), renderType: 'standard', customerEmail: null, items: [] });
  return persist(res, id, renderInput, rev);
}

module.exports = {
  statusHandler,
  saveHandler,
  SaveBody,
  saveMiddlewares: [rateLimit('autosave'), validate(SaveBody)],
};
