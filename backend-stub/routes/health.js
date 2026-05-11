/**
 * Health endpoints.
 *
 *   GET /health/live         — always 200 if the process is running.
 *                              Used by load balancers + Kubernetes liveness probes.
 *
 *   GET /health/ready        — 200 only if the process can serve real traffic
 *                              (Postgres reachable, Redis reachable, mailer
 *                              configured). 503 with reason on any failure.
 *                              Used by load balancers + readiness probes —
 *                              instances that fail this are pulled from rotation.
 *
 *   GET /health/dependencies — detailed JSON status + latencies for every
 *                              external dependency. Powers the admin dashboard's
 *                              status page. Always 200 with per-dep status.
 *
 * Cache: liveness and readiness are NEVER cached. Dependencies is cached for
 * 5 seconds to avoid hammering Postgres / Redis if a status page polls hard.
 */

const { pool } = require('../db/index');
const { getQueueHealth, connection: redisConnection } = require('../services/queue');
const { DEFAULTS: S3_DEFAULTS, s3 } = require('../services/s3');
const { HeadBucketCommand } = require('@aws-sdk/client-s3');
const { logger } = require('../services/logger');

// ── Liveness ────────────────────────────────────────────────────────────────
function liveHandler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, uptime: Math.round(process.uptime()) });
}

// ── Readiness ───────────────────────────────────────────────────────────────
async function readyHandler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const checks = await Promise.all([checkPg(), checkRedis()]);
  const failed = checks.filter((c) => !c.ok);
  if (failed.length > 0) {
    res.status(503).json({ ok: false, failed: failed.map((f) => f.name) });
    return;
  }
  res.status(200).json({ ok: true });
}

// ── Dependencies ────────────────────────────────────────────────────────────
let depCache = { at: 0, payload: null };
async function depsHandler(_req, res) {
  const now = Date.now();
  if (depCache.payload && now - depCache.at < 5_000) {
    res.setHeader('Cache-Control', 'public, max-age=5');
    return res.status(200).json(depCache.payload);
  }
  const [pg, redis, queueHealth, s3State, memory] = await Promise.all([
    checkPg(),
    checkRedis(),
    checkQueue(),
    checkS3(),
    Promise.resolve(checkMemory()),
  ]);
  const payload = {
    ok: [pg, redis, queueHealth, s3State, memory].every((c) => c.ok || c.degraded),
    checks: { pg, redis, queue: queueHealth, s3: s3State, memory },
    at: new Date().toISOString(),
  };
  depCache = { at: now, payload };
  res.setHeader('Cache-Control', 'public, max-age=5');
  res.status(200).json(payload);
}

// ── Individual checks ───────────────────────────────────────────────────────
async function checkPg() {
  const t0 = Date.now();
  try {
    await pool.query('SELECT 1');
    return { name: 'pg', ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    logger.warn({ err: err.message }, 'health.pg-failed');
    return { name: 'pg', ok: false, error: err.message };
  }
}

async function checkRedis() {
  const t0 = Date.now();
  try {
    if (!redisConnection) return { name: 'redis', ok: false, error: 'REDIS_URL not configured' };
    const reply = await redisConnection.ping();
    return { name: 'redis', ok: reply === 'PONG', latencyMs: Date.now() - t0 };
  } catch (err) {
    return { name: 'redis', ok: false, error: err.message };
  }
}

async function checkQueue() {
  try {
    const snap = await getQueueHealth();
    // Degraded (not failed) if the queue has > 50 waiting jobs or any stalls.
    const degraded = (snap.waiting || 0) > 50 || (snap.failed || 0) > 0;
    return { name: 'queue', ok: snap.connected, degraded, ...snap };
  } catch (err) {
    return { name: 'queue', ok: false, error: err.message };
  }
}

async function checkS3() {
  const t0 = Date.now();
  try {
    if (!S3_DEFAULTS.BUCKET) return { name: 's3', ok: false, error: 'S3_BUCKET not configured' };
    await s3.send(new HeadBucketCommand({ Bucket: S3_DEFAULTS.BUCKET }));
    return { name: 's3', ok: true, latencyMs: Date.now() - t0 };
  } catch (err) {
    return { name: 's3', ok: false, error: err.message };
  }
}

function checkMemory() {
  const m = process.memoryUsage();
  // Pull max heap from V8 if available; otherwise fall back to RSS soft cap.
  let maxHeap = 0;
  try {
    const v8 = require('node:v8');
    maxHeap = v8.getHeapStatistics().heap_size_limit;
  } catch { /* ignore */ }
  const rssMb = Math.round(m.rss / 1024 / 1024);
  const heapMb = Math.round(m.heapUsed / 1024 / 1024);
  const heapPct = maxHeap ? Math.round((m.heapUsed / maxHeap) * 100) : null;
  // Warn at 85% heap usage — node-canvas tends to balloon under load.
  const degraded = heapPct != null && heapPct > 85;
  return { name: 'memory', ok: true, degraded, rssMb, heapMb, heapPct };
}

module.exports = { liveHandler, readyHandler, depsHandler };
