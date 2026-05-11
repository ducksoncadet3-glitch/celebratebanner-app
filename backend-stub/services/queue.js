/**
 * BullMQ render queue.
 *
 * Replaces the in-memory queue in services/render-queue.js. The worker lives
 * in workers/render.worker.js and is run as its own process (separate from
 * the API server) so a long render can never starve incoming HTTP traffic.
 *
 * Dependencies:
 *   "bullmq":  "^5.34.0"
 *   "ioredis": "^5.4.1"
 *
 * Env:
 *   REDIS_URL                 redis://… (Upstash / ElastiCache / Render)
 *   RENDER_QUEUE_NAME         default 'cb-renders'
 *   RENDER_CONCURRENCY        worker-side concurrency, default 2
 *   RENDER_TIMEOUT_MS         per-job timeout, default 5 min
 *   RENDER_ATTEMPTS           max retries on transient failures, default 3
 */

const { Queue, QueueEvents, Worker } = require('bullmq');
const IORedis = require('ioredis');
const { logger } = require('./logger');

const QUEUE_NAME = process.env.RENDER_QUEUE_NAME || 'cb-renders';
const REDIS_URL  = process.env.REDIS_URL;
const CONCURRENCY = Number.parseInt(process.env.RENDER_CONCURRENCY || '2', 10);
const TIMEOUT_MS = Number.parseInt(process.env.RENDER_TIMEOUT_MS || `${5 * 60 * 1000}`, 10);
const ATTEMPTS   = Number.parseInt(process.env.RENDER_ATTEMPTS    || '3', 10);

if (!REDIS_URL && process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.warn('[queue] REDIS_URL not set — render queue is offline');
}

const connection = REDIS_URL ? new IORedis(REDIS_URL, { maxRetriesPerRequest: null }) : null;

const queue = connection
  ? new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: ATTEMPTS,
        backoff: { type: 'exponential', delay: 4_000 },
        removeOnComplete: { age: 24 * 60 * 60, count: 1_000 }, // keep 24h or 1k
        removeOnFail: { age: 7 * 24 * 60 * 60 },                // keep 7d
      },
    })
  : null;

const queueEvents = connection ? new QueueEvents(QUEUE_NAME, { connection }) : null;

if (queueEvents) {
  queueEvents.on('completed', ({ jobId }) => logger.info({ jobId }, 'render.completed'));
  queueEvents.on('failed', ({ jobId, failedReason }) =>
    logger.warn({ jobId, reason: failedReason }, 'render.failed'),
  );
  queueEvents.on('stalled', ({ jobId }) => logger.warn({ jobId }, 'render.stalled'));
}

/**
 * Enqueue an HD render. Returns the BullMQ job id. The worker picks it up
 * and writes progress + final asset keys to the `renders` table.
 *
 * Idempotency: pass `dedupeKey` (typically the Stripe session id) so retried
 * webhook deliveries don't enqueue duplicate renders.
 */
async function enqueueRender(payload, { dedupeKey } = {}) {
  if (!queue) throw new Error('Render queue unavailable (REDIS_URL not set)');
  const opts = { jobId: dedupeKey, timeout: TIMEOUT_MS };
  const job = await queue.add('hd-render', payload, opts);
  logger.info({ jobId: job.id, projectId: payload.projectId }, 'render.enqueued');
  return { jobId: job.id };
}

/** Best-effort cancel — only stops a queued job, not one already running. */
async function cancelRender(jobId) {
  if (!queue) return false;
  const job = await queue.getJob(jobId);
  if (!job) return false;
  if (await job.isActive()) {
    logger.warn({ jobId }, 'render.cancel-skipped (active)');
    return false;
  }
  await job.remove();
  logger.info({ jobId }, 'render.canceled');
  return true;
}

/** Inspect a job — used by the admin dashboard + /status route. */
async function getJob(jobId) {
  if (!queue) return null;
  const job = await queue.getJob(jobId);
  if (!job) return null;
  const state = await job.getState();
  return {
    id: job.id,
    state,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
  };
}

async function getQueueHealth() {
  if (!queue) return { connected: false };
  const [waiting, active, failed, completed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getFailedCount(),
    queue.getCompletedCount(),
    queue.getDelayedCount(),
  ]);
  return { connected: true, waiting, active, failed, completed, delayed };
}

/** Graceful shutdown — call from SIGTERM handler in api + worker processes. */
async function shutdown() {
  if (queueEvents) await queueEvents.close();
  if (queue) await queue.close();
  if (connection) connection.disconnect();
}

module.exports = {
  QUEUE_NAME,
  CONCURRENCY,
  TIMEOUT_MS,
  ATTEMPTS,
  connection,
  queue,
  Worker,        // re-exported so workers/render.worker.js builds with one import
  enqueueRender,
  cancelRender,
  getJob,
  getQueueHealth,
  shutdown,
};
