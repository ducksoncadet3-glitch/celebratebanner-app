/**
 * Admin authentication.
 *
 * Stateless JWT in an HttpOnly cookie + DB lookup. We don't trust the JWT
 * alone — every request looks up `users.is_admin` so we can revoke a user
 * just by flipping that boolean. CSRF protection via SameSite=Strict cookie
 * + a separate `x-csrf-token` header check on mutating methods.
 *
 * Endpoints (POST /api/admin/auth/login + POST /api/admin/auth/logout) live
 * here too — they're tightly coupled to the cookie format.
 *
 * Dependencies:
 *   "jsonwebtoken": "^9.0.2"
 *   "bcrypt":       "^5.1.1"
 *   "cookie":       "^1.0.2"
 *
 * Env:
 *   ADMIN_JWT_SECRET            32+ random bytes, base64url. ROTATE on leak.
 *   ADMIN_SESSION_TTL_HOURS     default 8
 *   ADMIN_COOKIE_NAME           default 'cb_admin'
 *   ADMIN_COOKIE_DOMAIN         optional (e.g. '.celebratebanner.com')
 */

const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookie = require('cookie');
const { one, query } = require('../db/index');
const { logger } = require('../services/logger');
const { record: auditRecord } = require('../services/audit');
const { rateLimit, clientIp } = require('./rate-limit');

const SECRET     = process.env.ADMIN_JWT_SECRET;
const TTL_HOURS  = Number.parseInt(process.env.ADMIN_SESSION_TTL_HOURS || '8', 10);
const COOKIE     = process.env.ADMIN_COOKIE_NAME || 'cb_admin';
const COOKIE_DOMAIN = process.env.ADMIN_COOKIE_DOMAIN;

if (!SECRET && process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.warn('[admin-auth] ADMIN_JWT_SECRET not set — admin endpoints will reject every request');
}

// ── Middleware ──────────────────────────────────────────────────────────────
async function adminAuth(req, res, next) {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies[COOKIE];
    if (!token) return res.status(401).json({ error: 'unauthenticated' });
    let payload;
    try {
      payload = jwt.verify(token, SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      return res.status(401).json({ error: 'invalid session' });
    }
    // Re-verify against the DB so revocation is immediate.
    const user = await one(
      `SELECT id, email, is_admin FROM users WHERE id = $1`,
      [payload.sub],
    );
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'not authorized' });
    }
    // CSRF: SameSite=Strict prevents cross-site cookies, AND we require a
    // separate x-csrf-token header on mutating verbs. The token is a derived
    // hash of the JWT so we don't need a second cookie — clients fetch
    // /api/admin/auth/csrf to get it.
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      const expected = csrfFor(token);
      const provided = req.headers['x-csrf-token'];
      if (!provided || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
        return res.status(403).json({ error: 'csrf failed' });
      }
    }
    req.user = { id: user.id, email: user.email };
    next();
  } catch (err) {
    logger.error({ err: err.message }, 'admin-auth.middleware-failed');
    res.status(500).json({ error: 'auth check failed' });
  }
}

function csrfFor(jwtString) {
  return crypto.createHmac('sha256', SECRET).update(`csrf:${jwtString}`).digest('base64url');
}

// ── Login / logout ──────────────────────────────────────────────────────────
async function loginHandler(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email + password required' });
  try {
    // Look up by email + verify password. Constant-time compare via bcrypt.
    const user = await one(
      `SELECT id, email, is_admin, password_hash FROM users WHERE email = $1`,
      [String(email).toLowerCase()],
    );
    // Always run a bcrypt compare even on missing user to prevent timing oracles.
    const ok = user
      ? await bcrypt.compare(password, user.password_hash || '$2b$10$invalid')
      : await bcrypt.compare(password, '$2b$10$invalid');
    if (!user || !user.is_admin || !ok) {
      await auditRecord({
        actorKind: 'system',
        action: 'admin.login-failed',
        subjectKind: 'user', subjectId: String(email).toLowerCase(),
        metadata: { reason: !user ? 'no-user' : !user.is_admin ? 'not-admin' : 'bad-password' },
        ip: clientIp(req),
        ua: req.headers['user-agent'],
      });
      // Generic message to avoid leaking which step failed.
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const token = jwt.sign(
      { sub: user.id },
      SECRET,
      { algorithm: 'HS256', expiresIn: `${TTL_HOURS}h` },
    );
    res.setHeader('Set-Cookie', cookie.serialize(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      domain: COOKIE_DOMAIN || undefined,
      maxAge: TTL_HOURS * 3600,
    }));
    await auditRecord({
      actorKind: 'admin',
      actorId: user.id,
      action: 'admin.login-ok',
      subjectKind: 'user', subjectId: user.id,
      ip: clientIp(req),
      ua: req.headers['user-agent'],
    });
    res.json({ ok: true, csrfToken: csrfFor(token), email: user.email });
  } catch (err) {
    logger.error({ err: err.message }, 'admin-auth.login-failed');
    res.status(500).json({ error: 'login failed' });
  }
}

async function logoutHandler(req, res) {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    domain: COOKIE_DOMAIN || undefined,
    maxAge: 0,
  }));
  if (req.user) {
    await auditRecord({
      actorKind: 'admin',
      actorId: req.user.id,
      action: 'admin.logout',
      subjectKind: 'user', subjectId: req.user.id,
      ip: clientIp(req),
      ua: req.headers['user-agent'],
    });
  }
  res.json({ ok: true });
}

/** Returns the CSRF token for the current session — call this once on page load. */
async function csrfHandler(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies[COOKIE];
  if (!token) return res.status(401).json({ error: 'unauthenticated' });
  res.json({ csrfToken: csrfFor(token) });
}

// ── Helpers for promoting a user to admin (one-shot bootstrap) ─────────────
/**
 * Create or promote a user to admin status. Call once at deploy time to
 * bootstrap the first operator account; subsequent admins are added via
 * the admin dashboard.
 *
 *   node -e "require('./middleware/admin-auth').bootstrap('you@…', 'pw').then(console.log)"
 */
async function bootstrap(email, password) {
  const hash = await bcrypt.hash(password, 12);
  await query(
    `INSERT INTO users (email, password_hash, is_admin)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_admin = TRUE`,
    [String(email).toLowerCase(), hash],
  );
  return { ok: true, email };
}

module.exports = {
  adminAuth,
  loginRateLimit: rateLimit('admin-login'),
  loginHandler,
  logoutHandler,
  csrfHandler,
  bootstrap,
};
