/**
 * Token-bucket rate limiter backed by Redis.
 *
 * Used to protect:
 *   • POST /api/payments/checkout       — 30 / IP / hour
 *   • POST /api/uploads/signed          — 200 / IP / hour
 *   • PATCH /api/projects/:id           — 600 / IP / hour (autosave heavy)
 *   • GET /api/downloads/...            — 100 / IP / 5 min
 *
 * If Redis is unavailable, requests are allowed through ("fail open") — better
 * to let traffic through than to take the site down. Failures are logged.
 *
 * Fail-open has two layers, because a store outage must never look like a
 * throttle to a paying customer:
 *   1. `insuranceLimiter` — an in-process memory limiter the library falls back
 *      to when the Redis store errors, so abuse protection degrades rather than
 *      disappears.
 *   2. The catch below discriminates a genuine limit rejection (a
 *      `RateLimiterRes`, a plain object carrying `msBeforeNext`) from a store
 *      failure (an `Error`). Only the former becomes a 429; an `Error` is
 *      logged and the request continues.
 *
 * Dependencies:
 *   "ioredis":         "^5.4.1"
 *   "rate-limiter-flexible": "^5.0.4"
 */

let RateLimiterRedis, RateLimiterMemory, IORedis;
try {
  ({ RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible'));
} catch {
  // Dependency missing — module degrades to no-op below.
}
try { IORedis = require('ioredis'); } catch { /* ignore */ }

let logger;
try { ({ logger } = require('../services/logger')); } catch { /* ignore */ }

const REDIS_URL = process.env.REDIS_URL;
const client = REDIS_URL && IORedis ? new IORedis(REDIS_URL, { maxRetriesPerRequest: 1 }) : null;

function makeLimiter(name, { points, durationSec }) {
  if (RateLimiterRedis && client) {
    return new RateLimiterRedis({
      storeClient: client,
      keyPrefix: `rl:${name}`,
      points,
      duration: durationSec,
      inMemoryBlockOnConsumed: points,
      // When the Redis store errors (outage, quota exhaustion), the library
      // routes the request to this in-process limiter instead of rejecting.
      insuranceLimiter: RateLimiterMemory
        ? new RateLimiterMemory({ keyPrefix: `rl:${name}`, points, duration: durationSec })
        : undefined,
    });
  }
  if (RateLimiterMemory) {
    return new RateLimiterMemory({ keyPrefix: `rl:${name}`, points, duration: durationSec });
  }
  return null;
}

const limiters = {
  checkout:    makeLimiter('checkout',    { points: 30,  durationSec: 60 * 60 }),
  uploads:     makeLimiter('uploads',     { points: 200, durationSec: 60 * 60 }),
  autosave:    makeLimiter('autosave',    { points: 600, durationSec: 60 * 60 }),
  downloads:   makeLimiter('downloads',   { points: 100, durationSec: 5 * 60 }),
  // Funnel events are cheap and frequent (one per product view), but still capped so a
  // single client cannot flood the analytics table.
  events:      makeLimiter('events',      { points: 300, durationSec: 60 * 60 }),
  // Aggressive limit on admin login to deter credential-stuffing attacks.
  'admin-login': makeLimiter('admin-login', { points: 10, durationSec: 60 }),
};

function clientIp(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * True only for a real rate-limit rejection. `rate-limiter-flexible` rejects
 * with a `RateLimiterRes` (a plain object with numeric `msBeforeNext` and
 * `remainingPoints`); any store failure rejects with an `Error`.
 */
function isLimitRejection(rejection) {
  return (
    rejection != null &&
    !(rejection instanceof Error) &&
    typeof rejection === 'object' &&
    typeof rejection.msBeforeNext === 'number'
  );
}

function rateLimit(name) {
  const limiter = limiters[name];
  return async function rateLimitMiddleware(req, res, next) {
    if (!limiter) return next();
    try {
      await limiter.consume(clientIp(req));
      next();
    } catch (rejection) {
      // A genuine throttle rejects with a RateLimiterRes — a plain object whose
      // `msBeforeNext` says when the caller may retry. A store failure rejects
      // with an Error. Treating the latter as a 429 would turn a Redis outage
      // into a hard block on uploads, autosave and downloads, so fail open.
      if (!isLimitRejection(rejection)) {
        logger?.error?.(
          { err: rejection, limiter: name },
          '[rate-limit] store unavailable — failing open',
        );
        return next();
      }
      const retryAfter = Math.max(1, Math.ceil((rejection.msBeforeNext || 1000) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: 'Too many requests. Try again in a moment.' });
    }
  };
}

module.exports = { rateLimit, clientIp, isLimitRejection };
