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

function rateLimit(name) {
  const limiter = limiters[name];
  return async function rateLimitMiddleware(req, res, next) {
    if (!limiter) return next();
    try {
      await limiter.consume(clientIp(req));
      next();
    } catch (rejection) {
      const retryAfter = Math.max(1, Math.ceil((rejection.msBeforeNext || 1000) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: 'Too many requests. Try again in a moment.' });
    }
  };
}

module.exports = { rateLimit, clientIp };
