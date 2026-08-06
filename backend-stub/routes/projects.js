/**
 * Project status + autosave routes.
 *
 *   GET   /api/projects/:id/status   — poll render/payment status (used by /success)
 *   PATCH /api/projects/:id          — autosave the canonical RenderInput (versioned)
 *
 * These are thin HTTP wrappers over the EXISTING data layer (db/projects.getStatus and
 * db/projects.saveRenderInput). No new behavior is introduced — this only mounts endpoints
 * that the frontend already calls (web/lib/api.ts) and that the repo already documents
 * (README.md, middleware/rate-limit.js "autosave", render.hd.js). The optimistic-concurrency
 * (rev) and 404/409 semantics come straight from db/projects.saveRenderInput.
 */

const { z } = require('zod');
const { getStatus, saveRenderInput } = require('../db/projects');
const { validate } = require('../middleware/validate');
const { rateLimit } = require('../middleware/rate-limit');
const { logger } = require('../services/logger');

// ── GET /api/projects/:id/status ─────────────────────────────────────────────
async function statusHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const status = await getStatus(req.params.id);
    res.status(200).json(status);
  } catch (err) {
    logger.error({ err: err.message, projectId: req.params.id }, 'projects.status-failed');
    res.status(500).json({ error: 'failed' });
  }
}

// PATCH body contract — mirrors web/lib/api.ts saveProject({ renderInput, rev }).
// renderInput is an opaque object (its full schema is validated by the render engine at
// render time); we only assert shape + a non-negative integer rev here.
const SaveBody = z.object({
  renderInput: z.record(z.unknown()),
  rev: z.number().int().min(0),
});

// ── PATCH /api/projects/:id ──────────────────────────────────────────────────
async function saveHandler(req, res) {
  try {
    const rev = await saveRenderInput({
      projectId: req.params.id,
      renderInput: req.valid.renderInput,
      rev: req.valid.rev,
    });
    res.status(200).json({ rev });
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ error: 'project not found' });
    if (err.status === 409) return res.status(409).json({ error: 'stale rev', currentRev: err.currentRev });
    logger.error({ err: err.message, projectId: req.params.id }, 'projects.save-failed');
    res.status(500).json({ error: 'failed' });
  }
}

module.exports = {
  statusHandler,
  saveHandler,
  SaveBody,
  saveMiddlewares: [rateLimit('autosave'), validate(SaveBody)],
};
