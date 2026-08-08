/**
 * Project access tokens.
 *
 * A stateless, project-scoped capability that proves the caller is the client that created
 * (owns) a given project — without a customer-account system. It is an HMAC over the
 * projectId using the same signing approach the architecture already uses for download
 * tokens (services/tokens.js), but with a SEPARATE domain-separated payload so a download
 * token can never be used as a project token or vice-versa.
 *
 * Why HMAC (not a DB row): status polling and autosave are hot paths; a stateless token
 * verifies with one hash and no DB round-trip, and there is nothing to garbage-collect.
 * The credential is project-scoped (bound to the id, lives for the project's lifetime);
 * rotate PROJECT_TOKEN_SECRET to revoke every outstanding token at once.
 *
 * Secret resolution: PROJECT_TOKEN_SECRET is the RECOMMENDED production secret — set it to a
 * dedicated high-entropy value. DOWNLOAD_TOKEN_SECRET is a COMPATIBILITY-ONLY fallback (it is
 * already a required production var, so tokens still verify on existing config), not the
 * preferred configuration. If neither is set, verification fails closed (every request is
 * rejected) rather than open.
 */

const crypto = require('node:crypto');

const SECRET = process.env.PROJECT_TOKEN_SECRET || process.env.DOWNLOAD_TOKEN_SECRET || '';

/** Domain-separated payload — distinct from download tokens' `${projectId}.${assetType}.${body}`. */
function payloadFor(projectId) {
  return `project.access.v1.${projectId}`;
}

/** Mint a token for a project. Deterministic HMAC — same id always yields the same token. */
function signProjectToken(projectId) {
  return crypto.createHmac('sha256', SECRET).update(payloadFor(projectId)).digest('base64url');
}

/** Constant-time verification that `token` authorizes `projectId`. */
function verifyProjectToken(projectId, token) {
  if (!SECRET || !token || !projectId) return false;
  const expected = signProjectToken(projectId);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(token));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Pull a project token from the request (Authorization: Bearer … or x-project-token). */
function extractProjectToken(req) {
  const auth = req.headers['authorization'];
  if (auth && /^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim();
  const hdr = req.headers['x-project-token'];
  return hdr ? String(hdr).trim() : '';
}

/** Is this request carrying the trusted server-to-server secret? (server components only.) */
function hasInternalSecret(req) {
  const expected = process.env.API_SHARED_SECRET;
  if (!expected) return false;
  const got = req.headers['x-internal-secret'];
  if (!got) return false;
  const a = Buffer.from(String(expected));
  const b = Buffer.from(String(got));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { signProjectToken, verifyProjectToken, extractProjectToken, hasInternalSecret };
