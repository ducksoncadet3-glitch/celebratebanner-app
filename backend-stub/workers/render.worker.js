#!/usr/bin/env node
/**
 * BullMQ render worker.
 *
 * Run this as a SEPARATE PROCESS from the API server:
 *
 *   node workers/render.worker.js
 *
 * Production deploy: Fly.io worker process, ECS task, Railway service, etc.
 * Same env vars as the API (DATABASE_URL, REDIS_URL, S3_*, etc).
 *
 * Concurrency is set in services/queue.js via RENDER_CONCURRENCY (default 2).
 * Each in-flight HD render peaks at ~600MB RAM, so don't oversubscribe.
 */

const { Worker } = require('bullmq');
const { QUEUE_NAME, CONCURRENCY, connection, shutdown: queueShutdown } = require('../services/queue');
const { logger } = require('../services/logger');
const { metrics } = require('../services/metrics');
const { renderBannerHD, renderStandMockupBuffer } = require('../services/render');
const { renderVideoSlideshow } = require('../video/encoder');
const { putBuffer, renderKey } = require('../services/s3');
const { query, one } = require('../db/index');
const { markReady } = require('../db/projects');
const { sendDeliveryEmail } = require('../services/mailer');
const { issueDownloadToken } = require('./../services/tokens');

if (!connection) {
  logger.error('REDIS_URL not configured — worker cannot start');
  process.exit(1);
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const t0 = Date.now();
    const { projectId, renderInput, productIds = [], renderId } = job.data;

    logger.info({ jobId: job.id, projectId, attempt: job.attemptsMade + 1 }, 'render.start');

    // Insert/update the renders row up front so the admin dashboard can see it.
    await query(
      `INSERT INTO renders (id, project_id, queue_job_id, status, started_at, attempts)
       VALUES ($1, $2, $3, 'running', NOW(), $4)
       ON CONFLICT (id) DO UPDATE SET
         status = 'running',
         started_at = COALESCE(renders.started_at, EXCLUDED.started_at),
         attempts = renders.attempts + 1`,
      [renderId, projectId, String(job.id), job.attemptsMade + 1],
    );

    const reportProgress = async (pct) => {
      await job.updateProgress(pct);
      await query(`UPDATE renders SET progress = $1 WHERE id = $2`, [pct, renderId]);
    };

    try {
      // 1) HD render
      await reportProgress(5);
      const banner = await renderBannerHD(renderInput);
      await reportProgress(55);

      // 2) Stand mockup
      const mockupBytes = await renderStandMockupBuffer(banner.png);
      await reportProgress(70);

      // 3) Upload to S3
      const pngKey   = renderKey(projectId, renderId, 'png');
      const jpegKey  = renderKey(projectId, renderId, 'jpeg');
      const mockKey  = renderKey(projectId, renderId, 'mockup');
      await Promise.all([
        putBuffer({ key: pngKey,  body: banner.png,  contentType: 'image/png',  cacheControl: 'private, max-age=604800' }),
        putBuffer({ key: jpegKey, body: banner.jpeg, contentType: 'image/jpeg', cacheControl: 'private, max-age=604800' }),
        putBuffer({ key: mockKey, body: mockupBytes, contentType: 'image/png',  cacheControl: 'private, max-age=604800' }),
      ]);
      await reportProgress(85);

      // 4) Optional video slideshow upsell
      let videoKey = null;
      if (productIds.includes('video')) {
        try {
          const videoBuf = await renderVideoSlideshow(renderInput, {
            durationSec: 60,
            audioUrl: process.env.SLIDESHOW_DEFAULT_AUDIO_URL,
          });
          videoKey = renderKey(projectId, renderId, 'video');
          await putBuffer({ key: videoKey, body: videoBuf, contentType: 'video/mp4', cacheControl: 'private, max-age=604800' });
        } catch (err) {
          // Video failure shouldn't block the banner — log and continue.
          logger.warn({ jobId: job.id, err: err.message }, 'render.video-failed');
        }
      }
      await reportProgress(95);

      // 5) Mark renders row + project row done
      const durationMs = Date.now() - t0;
      await query(
        `UPDATE renders SET
            status = 'done', progress = 100,
            png_key = $1, jpeg_key = $2, mockup_key = $3, video_key = $4,
            dimensions_w = $5, dimensions_h = $6, dpi = $7,
            finished_at = NOW(), duration_ms = $8
          WHERE id = $9`,
        [pngKey, jpegKey, mockKey, videoKey, banner.dimensions.width, banner.dimensions.height, banner.dpi, durationMs, renderId],
      );
      await markReady({ projectId, renderId });

      // 6) Issue delivery tokens + email
      const project = await one(`SELECT customer_email FROM projects WHERE id = $1`, [projectId]);
      const tokens = {
        download: await issueDownloadToken({ projectId, assetType: 'jpeg', s3Key: jpegKey }),
        ...(videoKey
          ? { video: await issueDownloadToken({ projectId, assetType: 'video', s3Key: videoKey }) }
          : {}),
      };
      if (project?.customer_email) {
        await sendDeliveryEmail({
          to: project.customer_email,
          projectId,
          links: {
            downloadUrl: tokens.download.url,
            videoUrl: tokens.video?.url,
            expiresAt: tokens.download.expiresAt,
          },
        });
      }

      metrics.observeRenderDuration(durationMs);
      logger.info({ jobId: job.id, projectId, durationMs }, 'render.done');
      return { renderId, pngKey, jpegKey, mockKey, videoKey, durationMs };
    } catch (err) {
      await query(
        `UPDATE renders SET
            status = 'failed', error_message = $1, finished_at = NOW(),
            duration_ms = $2
          WHERE id = $3`,
        [err.message?.slice(0, 500) ?? String(err), Date.now() - t0, renderId],
      );
      metrics.incRenderFailures();
      logger.error({ jobId: job.id, projectId, err: err.message }, 'render.failed');
      throw err; // BullMQ retry policy takes over
    }
  },
  { connection, concurrency: CONCURRENCY },
);

worker.on('error', (err) => logger.error({ err: err.message }, 'worker.error'));

// ── Graceful shutdown ───────────────────────────────────────────────────────
async function shutdown(signal) {
  logger.info({ signal }, 'worker.shutdown.start');
  try {
    await worker.close();
    await queueShutdown();
  } finally {
    process.exit(0);
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

logger.info({ concurrency: CONCURRENCY }, 'worker.ready');
