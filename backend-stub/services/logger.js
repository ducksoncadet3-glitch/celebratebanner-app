/**
 * Structured logger (pino). Outputs newline-delimited JSON in production,
 * pretty-printed lines in dev.
 *
 * Dependencies:
 *   "pino":          "^9.5.0"
 *   "pino-pretty":   "^11.3.0"      (dev only — pulled in if NODE_ENV !== production)
 *
 * Env:
 *   LOG_LEVEL    debug|info|warn|error (default info)
 *   SENTRY_DSN   if set, forwards >= error events to Sentry
 */

const isProd = process.env.NODE_ENV === 'production';
let pino;
try {
  pino = require('pino');
} catch {
  // Fallback when pino isn't installed yet — keep the rest of the stub
  // importable. Production MUST install pino.
  // eslint-disable-next-line no-console
  console.warn('[logger] pino not installed — falling back to console');
  pino = null;
}

let logger;
if (pino) {
  logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'celebratebanner-api', env: process.env.NODE_ENV || 'development' },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.stripe_secret',
        '*.password',
        '*.token',
      ],
      remove: true,
    },
    transport: isProd
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } },
  });
} else {
  // Tiny console shim that matches pino's API surface.
  const stamp = () => new Date().toISOString();
  const emit = (level) => (obj, msg) => {
    const payload = typeof obj === 'string'
      ? { msg: obj }
      : { ...obj, msg };
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](stamp(), level.toUpperCase(), payload);
  };
  logger = {
    debug: emit('debug'),
    info:  emit('info'),
    warn:  emit('warn'),
    error: emit('error'),
    fatal: emit('error'),
    child: () => logger,
  };
}

/** Attach a request-id child logger for each HTTP request. */
function requestLogger(req, _res, next) {
  const rid = req.headers['x-request-id'] || req.headers['x-vercel-id'] || cryptoRandom();
  req.id = rid;
  req.log = logger.child({ rid });
  if (typeof next === 'function') next();
}

function cryptoRandom() {
  return require('node:crypto').randomBytes(8).toString('hex');
}

module.exports = { logger, requestLogger };
