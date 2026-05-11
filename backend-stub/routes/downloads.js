/**
 * GET /api/downloads/:projectId/:assetType/:token
 *
 * Resolves a download token into a short-lived signed S3 GET URL and 302s
 * the customer to it. The signed URL is valid for 5 minutes, just long enough
 * for the browser to start the download.
 */

const { rateLimit, clientIp } = require('../middleware/rate-limit');
const { resolveDownloadToken } = require('../services/tokens');
const { metrics } = require('../services/metrics');
const { logger } = require('../services/logger');

async function downloadHandler(req, res) {
  const { projectId, assetType, token } = req.params;
  try {
    const { url } = await resolveDownloadToken({
      projectId,
      assetType,
      token,
      ip: clientIp(req),
      ua: req.headers['user-agent'],
    });
    metrics.incDownloads(assetType);
    // Send a short cache-control so the browser doesn't keep redirecting to
    // an URL it cached — the S3 signed URL changes every request.
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.redirect(302, url);
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) logger.error({ err: err.message, projectId, assetType }, 'download.failed');
    res.status(status).json({ error: err.message || 'download failed' });
  }
}

module.exports = { downloadHandler, middlewares: [rateLimit('downloads')] };
