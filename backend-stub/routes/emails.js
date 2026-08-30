/**
 * Internal transactional-email endpoints.
 *
 *   POST /api/emails/order-confirmation   — send the "we got your order" email
 *
 * Server-to-server ONLY. Gated by the internal shared secret (x-internal-secret /
 * API_SHARED_SECRET) — the same trusted-caller pattern used by the project-status read.
 * The web app's /api/order-confirmation Route Handler is the sole caller; the browser
 * never reaches this route and never sees POSTMARK_API_TOKEN.
 *
 * The ONLY accepted input is a Stripe session id. The recipient, projectId, and order
 * reference are derived server-side from the authoritative payments row (see
 * services/order-confirmation.js) — a caller-supplied address is never trusted, so this
 * endpoint cannot be abused as an email relay. Sends are idempotent per paid session.
 */

const { z } = require('zod');
const db = require('../db/projects');
const mailer = require('../services/mailer');
const { hasInternalSecret } = require('../services/project-token');
const { logger } = require('../services/logger');
const { runConfirmation } = require('../services/order-confirmation');

const Body = z.object({
  sessionId: z.string().min(1).max(200),
});

// ── POST /api/emails/order-confirmation ──────────────────────────────────────
async function orderConfirmationHandler(req, res) {
  if (!hasInternalSecret(req)) {
    // Do not distinguish "no secret configured" from "wrong secret".
    return res.status(401).json({ error: 'authorization required' });
  }
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ sent: false, error: 'sessionId is required' });
  }
  try {
    const { status, body } = await runConfirmation({
      sessionId: parsed.data.sessionId,
      db,
      mailer,
      log: logger,
    });
    return res.status(status).json(body);
  } catch (err) {
    // A confirmation failure must never surface as an error to the caller.
    logger.error({ err: err.message }, 'emails.confirmation-failed');
    return res.status(200).json({ sent: false });
  }
}

module.exports = { orderConfirmationHandler };
