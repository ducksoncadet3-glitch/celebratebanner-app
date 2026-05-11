/**
 * Alert dispatch.
 *
 * Two sinks, fire-and-forget:
 *   1. Sentry — captureException() / captureMessage() for errors and warnings.
 *   2. Webhook — POSTs to ALERT_WEBHOOK_URL (Discord, Slack, generic). Used for
 *      operational signals that aren't exceptions (queue stalls, repeated
 *      webhook failures, repeated download 404s).
 *
 * Deduplication: identical alerts within ALERT_DEDUPE_TTL_SECONDS (default 300)
 * collapse to one webhook POST. Implemented with Redis SETNX so dedupe works
 * across multiple API instances. Falls back to in-process if Redis is missing.
 *
 * Failures here NEVER throw. Alerting must never take the service down.
 */

const crypto = require('node:crypto');
const { logger } = require('./logger');

let Sentry = null;
try {
  Sentry = require('@sentry/node');
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      maxBreadcrumbs: 50,
    });
  }
} catch {
  Sentry = null;
}

let ioRedis = null;
try { ioRedis = require('ioredis'); } catch { /* optional */ }

const REDIS_URL = process.env.REDIS_URL;
const DEDUPE_TTL = Number.parseInt(process.env.ALERT_DEDUPE_TTL_SECONDS || '300', 10);
const WEBHOOK = process.env.ALERT_WEBHOOK_URL;
const redis = ioRedis && REDIS_URL ? new ioRedis(REDIS_URL, { maxRetriesPerRequest: 1 }) : null;

const memoryDedupe = new Map(); // fingerprint → expiresAt(ms)

async function shouldFire(fingerprint) {
  if (redis) {
    try {
      // SET key 1 NX EX <ttl> — returns OK if first, null if already exists.
      const r = await redis.set(`alert:${fingerprint}`, '1', 'NX', 'EX', DEDUPE_TTL);
      return r === 'OK';
    } catch {
      // fall through to memory dedupe
    }
  }
  const now = Date.now();
  for (const [k, exp] of memoryDedupe) if (exp < now) memoryDedupe.delete(k);
  if (memoryDedupe.has(fingerprint)) return false;
  memoryDedupe.set(fingerprint, now + DEDUPE_TTL * 1000);
  return true;
}

function fingerprint(obj) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex').slice(0, 16);
}

/**
 * Capture an error: reports to Sentry AND posts a webhook (if dedupe allows).
 * Always returns void; never throws.
 */
async function captureError(err, context = {}) {
  try {
    logger.error({ err: err.message, ...context }, context.event || 'alert.error');
    if (Sentry) Sentry.captureException(err, { extra: context });
    const fp = fingerprint({ kind: 'error', name: err.name, message: err.message, event: context.event });
    if (await shouldFire(fp)) await postWebhook(`🚨 ${context.event || 'error'}: ${err.message}`, { ...context, stack: err.stack });
  } catch (innerErr) {
    logger.error({ err: innerErr.message }, 'alert.dispatch-failed');
  }
}

/**
 * Capture a non-exception warning (queue stall, repeated webhook failures).
 * fingerprintKey controls dedupe; pass the SAME key for the same kind of alert.
 */
async function captureWarning(message, { fingerprintKey, ...context } = {}) {
  try {
    logger.warn(context, message);
    if (Sentry) Sentry.captureMessage(message, { level: 'warning', extra: context });
    const fp = fingerprint({ kind: 'warn', key: fingerprintKey || message });
    if (await shouldFire(fp)) await postWebhook(`⚠️ ${message}`, context);
  } catch (innerErr) {
    logger.error({ err: innerErr.message }, 'alert.dispatch-failed');
  }
}

async function postWebhook(title, fields) {
  if (!WEBHOOK) return;
  try {
    // Generic JSON payload — works for Slack incoming webhooks, Discord, and
    // anything that accepts JSON. For richer Slack/Discord formatting, wrap
    // this with their schema.
    const body = JSON.stringify({
      content: `${title}\n\`\`\`json\n${truncate(JSON.stringify(fields, null, 2), 1500)}\n\`\`\``,
      text: title,
      attachments: [{ fields: Object.entries(fields).map(([k, v]) => ({ title: k, value: String(v).slice(0, 500), short: true })) }],
    });
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(t);
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'alert.webhook-failed');
  }
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

module.exports = { captureError, captureWarning };
