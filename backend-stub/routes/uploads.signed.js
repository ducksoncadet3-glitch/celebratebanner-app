/**
 * POST /api/uploads/signed
 *
 * Exchange file metadata for a presigned S3 POST policy. The browser uploads
 * directly to S3 — no bytes touch our API server.
 *
 * Idempotency: if (projectId, sha256) already exists in `uploads`, we return
 * the existing record. The client treats this as success and skips the upload.
 *
 * Body:
 *   { projectId, filename, contentType, bytes, sha256, width, height }
 */

const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { rateLimit } = require('../middleware/rate-limit');
const { createUploadPolicy } = require('../services/s3');
const { optimize: optimizeImage } = require('../services/image-optimizer');
const { query, one } = require('../db/index');
const { metrics } = require('../services/metrics');
const { logger } = require('../services/logger');

// Delay before kicking off image-variant generation. Just long enough that
// most browser→S3 uploads have finished. For the production-correct path,
// wire S3 ObjectCreated → SNS → this handler so it fires the moment the upload
// completes (no guesswork). See backend-stub/README.md for the SNS template.
const OPTIMIZE_DELAY_MS = Number.parseInt(process.env.IMAGE_OPT_DELAY_MS || '8000', 10);

const Body = z.object({
  projectId:   z.string().regex(/^proj_[a-zA-Z0-9_-]{6,32}$/),
  filename:    z.string().min(1).max(256),
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/),
  bytes:       z.number().int().min(1).max(50 * 1024 * 1024),
  sha256:      z.string().regex(/^[a-f0-9]{64}$/),
  width:       z.number().int().min(1),
  height:      z.number().int().min(1),
});

async function signedUploadHandler(req, res) {
  const body = req.valid;
  try {
    // Idempotency check
    const existing = await one(
      `SELECT id, asset_url FROM uploads WHERE project_id = $1 AND sha256 = $2`,
      [body.projectId, body.sha256],
    );
    if (existing) {
      return res.status(200).json({
        skipUpload: true,
        assetUrl: existing.asset_url,
      });
    }

    const policy = await createUploadPolicy({
      projectId: body.projectId,
      contentType: body.contentType,
      bytes: body.bytes,
      sha256: body.sha256,
    });

    // Pre-create the uploads row so the asset URL is reservable. The render
    // worker reads from this table to find photos.
    await query(
      `INSERT INTO uploads (project_id, s3_bucket, s3_key, asset_url, content_type, bytes, sha256, width, height)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (project_id, sha256) DO NOTHING`,
      [body.projectId, policy.bucket, policy.key, policy.assetUrl, body.contentType, body.bytes, body.sha256, body.width, body.height],
    );

    metrics.incUploadsRequested();
    res.status(200).json({
      url: policy.url,
      fields: policy.fields,
      assetUrl: policy.assetUrl,
      expiresAt: policy.expiresAt,
    });

    // Fire-and-forget: schedule image-variant generation after the browser
    // has had time to complete the S3 upload. The optimizer is idempotent and
    // catches its own errors — if the file isn't there yet, it just logs.
    setTimeout(() => {
      optimizeImage({
        projectId: body.projectId,
        s3Key: policy.key,
        bucket: policy.bucket,
      }).catch((err) => {
        logger.warn({ err: err.message, s3Key: policy.key }, 'uploads.optimize-failed');
      });
    }, OPTIMIZE_DELAY_MS);
  } catch (err) {
    logger.error({ err: err.message, projectId: body.projectId }, 'uploads.signed.failed');
    res.status(500).json({ error: 'Could not start upload' });
  }
}

module.exports = {
  signedUploadHandler,
  middlewares: [rateLimit('uploads'), validate(Body)],
};
