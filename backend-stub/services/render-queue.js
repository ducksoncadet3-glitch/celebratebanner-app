/**
 * DEPRECATED — kept only as a single-process fallback for local development
 * when Redis isn't available. Production uses services/queue.js (BullMQ).
 *
 * Tiny in-memory queue: concurrency-capped, no retries, dies with the process.
 * Do NOT import this from production code paths.
 */

const crypto = require('node:crypto');

const CONCURRENCY = Number.parseInt(process.env.RENDER_CONCURRENCY || '2', 10);
const JOBS = new Map();              // jobId -> { status, progress, result, error }
const WAITING = [];                  // queued jobs awaiting a slot
let RUNNING = 0;

function newJobId() {
  return 'r_' + crypto.randomBytes(6).toString('hex');
}

/**
 * Enqueue a render job. `worker` is an async function that accepts a single
 * `progress(0..100)` callback and returns the final result. The job is queued
 * if all concurrency slots are taken.
 */
function enqueue(worker) {
  const jobId = newJobId();
  const job = { status: 'queued', progress: 0, result: null, error: null };
  JOBS.set(jobId, job);

  return new Promise((resolve, reject) => {
    const run = async () => {
      RUNNING++;
      job.status = 'running';
      try {
        job.result = await worker((p) => {
          job.progress = Math.max(0, Math.min(100, Math.round(p)));
        });
        job.progress = 100;
        job.status = 'done';
        resolve({ jobId, ...job });
      } catch (err) {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : String(err);
        reject(err);
      } finally {
        RUNNING--;
        // Pull next waiter if any
        const next = WAITING.shift();
        if (next) next();
      }
    };

    if (RUNNING < CONCURRENCY) {
      run();
    } else {
      WAITING.push(run);
    }
  });
}

function status(jobId) {
  return JOBS.get(jobId) || null;
}

module.exports = { enqueue, status };
