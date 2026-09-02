'use strict';

/**
 * Self-serve delivery for a paid ready-made order.
 *
 * A ready-made purchase has no render, so the success page had nothing to show and email was
 * the customer's only way to reach the artwork they had just paid for. This gives the page a
 * real download without weakening anything:
 *
 *   • the authorization is re-decided from the database on every call (paid, not refunded,
 *     ready-made, asset configured) — nothing is trusted from the browser;
 *   • the customer receives a tokenized /api/downloads URL, never the S3 key, never a
 *     presigned S3 URL, never a permanent link;
 *   • the token is 'self_serve' and short-lived. Issuing it replaces only the previous
 *     self_serve token, so the emailed 'delivery' token keeps working for its full 7 days;
 *   • a refund deletes every token for the project AND fails the check here, so a refunded
 *     order cannot mint a fresh one.
 */

const { one } = require('../db/index');
const { readyMadeByTemplateId } = require('../config/ready-made-products');
const { decideDelivery, messageFor } = require('./delivery-eligibility');
const { issueDownloadToken, revokeProjectTokensByPurpose } = require('./tokens');
const { logger } = require('./logger');

/**
 * How long a success-page authorization lives. Deliberately much shorter than the emailed
 * link: the page can always ask again while the order is still valid, so there is no reason
 * to leave a long-lived credential behind in a browser the customer may not own.
 */
const SELF_SERVE_TTL_DAYS = 1;

/** The facts the decision needs, read fresh. */
async function loadFacts(projectId) {
  const project = await one(
    'SELECT id, status, template_id FROM projects WHERE id = $1',
    [projectId],
  );
  if (!project) return { project: null, payment: null, readyMade: null };
  const payment = await one(
    `SELECT status, product_ids FROM payments
      WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [projectId],
  );
  return { project, payment, readyMade: readyMadeByTemplateId(project.template_id) };
}

/**
 * Decide, and on success mint a short-lived tokenized download URL.
 * Returns a customer-facing shape only — no S3 key, no token, no internal reason.
 */
async function authorizeSelfServeDownload(projectId) {
  const facts = await loadFacts(projectId);
  const { state, allowed } = decideDelivery(facts);

  if (!allowed) {
    return {
      available: false,
      state,
      message: messageFor(state),
      productMode: facts.readyMade ? 'ready-made' : 'personalized',
      productName: facts.readyMade ? facts.readyMade.name : null,
    };
  }

  const { readyMade } = facts;
  // At most one live self-serve authorization per project. This deletes ONLY self_serve
  // rows — the emailed delivery token is a different purpose and is never touched.
  await revokeProjectTokensByPurpose(projectId, 'self_serve');
  const download = await issueDownloadToken({
    projectId,
    assetType: readyMade.masterAssetType,
    s3Key: readyMade.masterAssetKey,
    ttlDays: SELF_SERVE_TTL_DAYS,
    purpose: 'self_serve',
  });

  logger.info({ projectId, slug: readyMade.slug }, 'readymade.self-serve-authorized');

  return {
    available: true,
    state: 'ok',
    productMode: 'ready-made',
    productName: readyMade.name,
    downloadUrl: download.url,
    expiresAt: download.expiresAt,
  };
}

module.exports = { authorizeSelfServeDownload, SELF_SERVE_TTL_DAYS };
