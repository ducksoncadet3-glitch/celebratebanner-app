/**
 * Project lifecycle service.
 *
 * Production implementation backed by Postgres (db/projects.js). This module
 * is a thin facade so existing callers (payments routes, webhooks) keep their
 * imports stable while the persistence layer migrates underneath.
 *
 * For local dev without a database, set USE_MEMORY_PROJECT_STORE=1 to fall
 * back to an in-memory Map — handy when developing the Stripe flow in
 * isolation.
 */

const projects = require('../db/projects');
const { issueDownloadToken } = require('./tokens');
const { logger } = require('./logger');

const MEMORY = process.env.USE_MEMORY_PROJECT_STORE === '1';
const MEM = new Map();

async function createProjectIfMissing(payload) {
  if (MEMORY) {
    if (MEM.has(payload.projectId)) return MEM.get(payload.projectId);
    const row = { ...payload, status: 'pending', createdAt: new Date().toISOString() };
    MEM.set(payload.projectId, row);
    return row;
  }
  return projects.createIfMissing(payload);
}

async function markProjectPaid(payload) {
  if (MEMORY) {
    const existing = MEM.get(payload.projectId) || { projectId: payload.projectId };
    MEM.set(payload.projectId, { ...existing, ...payload, status: 'paid', paidAt: new Date().toISOString() });
    return;
  }
  return projects.markPaid(payload);
}

async function markProjectFailed(payload) {
  if (MEMORY) {
    const existing = MEM.get(payload.projectId) || { projectId: payload.projectId };
    MEM.set(payload.projectId, { ...existing, ...payload, status: 'failed', failedAt: new Date().toISOString() });
    return;
  }
  return projects.markFailed(payload);
}

async function markProjectRefunded(payload) {
  if (MEMORY) {
    const existing = MEM.get(payload.projectId) || { projectId: payload.projectId };
    MEM.set(payload.projectId, { ...existing, ...payload, status: 'refunded', refundedAt: new Date().toISOString() });
    return;
  }
  return projects.markRefunded(payload);
}

async function getProjectStatus(projectId) {
  if (MEMORY) {
    const p = MEM.get(projectId);
    if (!p) return { projectId, status: 'pending' };
    return {
      projectId,
      status: p.status,
      renderProgress: p.renderProgress ?? (p.status === 'ready' ? 100 : 0),
      downloadUrl: p.downloadUrl,
      videoUrl: p.videoUrl,
    };
  }
  return projects.getStatus(projectId);
}

/**
 * Compatibility shim — the old webhook called these to trigger render +
 * signed-download generation. With BullMQ + render worker the work now happens
 * asynchronously; these functions remain as no-ops in case any legacy caller
 * still references them.
 */
async function triggerRender({ projectId }) {
  logger.warn({ projectId }, 'projects.triggerRender called — render now lives in BullMQ worker; ignoring');
  return { renderId: 'noop' };
}

async function generateSignedDownloads({ projectId, productIds = [] }) {
  // Delegate to tokens service. Used only by legacy paths; new code calls
  // issueDownloadToken directly inside the render worker.
  const downloadUrl = await issueDownloadToken({ projectId, assetType: 'jpeg', s3Key: `renders/${projectId}/latest/jpeg.jpeg` });
  const wantsVideo = productIds.includes('video');
  const video = wantsVideo
    ? await issueDownloadToken({ projectId, assetType: 'video', s3Key: `renders/${projectId}/latest/video.mp4` })
    : undefined;
  return {
    downloadUrl: downloadUrl.url,
    videoUrl: video?.url,
    expiresAt: downloadUrl.expiresAt,
  };
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
