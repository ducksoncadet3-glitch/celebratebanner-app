/**
 * Project lifecycle service.
 *
 * Replace the in-memory Map with your real persistence layer (Postgres, Mongo,
 * DynamoDB, etc.). The function signatures and shapes are stable — callers
 * (the webhook + checkout route) don't need to change.
 */

const crypto = require('node:crypto');

// ── Replace with your DB ─────────────────────────────────────────────────────
const PROJECTS = new Map(); // projectId -> project record

async function createProjectIfMissing({ projectId, templateId, renderType, customerEmail, items }) {
  if (PROJECTS.has(projectId)) return PROJECTS.get(projectId);
  const project = {
    projectId,
    templateId,
    renderType,
    customerEmail,
    items,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  PROJECTS.set(projectId, project);
  return project;
}

async function markProjectPaid({ projectId, stripeSessionId, paymentIntentId, amountTotalCents, currency, customerEmail, productIds, shippingAddress }) {
  const existing = PROJECTS.get(projectId) || { projectId };
  const updated = {
    ...existing,
    status: 'paid',
    paidAt: new Date().toISOString(),
    stripeSessionId,
    paymentIntentId,
    amountTotalCents,
    currency,
    customerEmail: existing.customerEmail || customerEmail,
    productIds: productIds && productIds.length ? productIds : existing.items || [],
    shippingAddress,
  };
  PROJECTS.set(projectId, updated);
  return updated;
}

async function markProjectFailed({ projectId, reason, stripeSessionId }) {
  const existing = PROJECTS.get(projectId) || { projectId };
  const updated = { ...existing, status: 'failed', failedAt: new Date().toISOString(), failureReason: reason, stripeSessionId };
  PROJECTS.set(projectId, updated);
  return updated;
}

async function markProjectRefunded({ projectId, stripeChargeId, amountRefundedCents }) {
  const existing = PROJECTS.get(projectId) || { projectId };
  const updated = { ...existing, status: 'refunded', refundedAt: new Date().toISOString(), stripeChargeId, amountRefundedCents };
  PROJECTS.set(projectId, updated);
  // Real impl: revoke any active signed URLs.
  return updated;
}

async function getProjectStatus(projectId) {
  const p = PROJECTS.get(projectId);
  if (!p) return { projectId, status: 'pending' };
  return {
    projectId: p.projectId,
    status: p.status,
    renderProgress: p.renderProgress ?? (p.status === 'ready' ? 100 : p.status === 'paid' ? 35 : 0),
    downloadUrl: p.downloadUrl,
    videoUrl: p.videoUrl,
    expiresAt: p.expiresAt,
    errorMessage: p.failureReason,
  };
}

// ── Render trigger ───────────────────────────────────────────────────────────
async function triggerRender({ projectId, templateId, renderType, productIds }) {
  // Enqueue a render job. Replace with your real queue (BullMQ, SQS, etc.).
  const renderId = `r_${crypto.randomBytes(6).toString('hex')}`;
  // Pretend it's instant for now:
  const project = PROJECTS.get(projectId) || { projectId };
  PROJECTS.set(projectId, { ...project, renderId, renderType, templateId, renderProgress: 100 });
  return { renderId };
}

// ── Signed downloads ─────────────────────────────────────────────────────────
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

async function generateSignedDownloads({ projectId, renderId, productIds }) {
  // In real life: sign a CloudFront/Cloudinary/S3 URL with an expiry.
  // Here we just synthesize a placeholder that the frontend can show.
  const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();
  const base = process.env.API_PUBLIC_URL || 'https://api.celebratebanner.com';
  const wantsVideo = productIds.includes('video');
  const links = {
    downloadUrl: `${base}/files/${projectId}/${renderId}/banner.zip?sig=stub&exp=${encodeURIComponent(expiresAt)}`,
    videoUrl: wantsVideo
      ? `${base}/files/${projectId}/${renderId}/slideshow.mp4?sig=stub&exp=${encodeURIComponent(expiresAt)}`
      : undefined,
    expiresAt,
  };
  const project = PROJECTS.get(projectId) || { projectId };
  PROJECTS.set(projectId, { ...project, ...links, status: 'ready' });
  return links;
}

module.exports = {
  createProjectIfMissing,
  markProjectPaid,
  markProjectFailed,
  markProjectRefunded,
  getProjectStatus,
  triggerRender,
  generateSignedDownloads,
};
