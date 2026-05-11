/**
 * Download token system.
 *
 * Tokens are HMAC-signed strings that resolve to a specific S3 object for a
 * specific project, with a server-side expiration row in `download_tokens`.
 * Two layers of defense:
 *   1. HMAC signature verifies the token wasn't tampered with.
 *   2. DB row verifies the token hasn't expired, been revoked, or exceeded
 *      its usage cap.
 *
 * Env:
 *   DOWNLOAD_TOKEN_SECRET     32+ random bytes, hex/base64. ROTATE on leak.
 *   DOWNLOAD_TOKEN_TTL_DAYS   default 7
 *   DOWNLOAD_TOKEN_MAX_USES   default 100 — per-token cap (anti-share)
 */

const crypto = require('node:crypto');
const { query, one } = require('../db/index');
const { signedGet } = require('./s3');

const SECRET = process.env.DOWNLOAD_TOKEN_SECRET || '';
const TTL_DAYS = Number.parseInt(process.env.DOWNLOAD_TOKEN_TTL_DAYS || '7', 10);
const MAX_USES = Number.parseInt(process.env.DOWNLOAD_TOKEN_MAX_USES || '100', 10);

if (!SECRET && process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.warn('[tokens] DOWNLOAD_TOKEN_SECRET not set — download links will not work');
}

function b64u(buf) {
  return Buffer.from(buf).toString('base64url');
}

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token + SECRET).digest('hex');
}

/**
 * Issue a new download token. Returns the URL the customer clicks plus the
 * underlying token string (useful for tests). Writes a row to download_tokens
 * so we can revoke or audit usage.
 */
async function issueDownloadToken({ projectId, assetType, s3Key, ttlDays = TTL_DAYS }) {
  const tokenBody = b64u(crypto.randomBytes(24));
  const sig = sign(`${projectId}.${assetType}.${tokenBody}`);
  const token = `${tokenBody}.${sig}`;
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO download_tokens (project_id, asset_type, s3_key, token_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [projectId, assetType, s3Key, tokenHash, expiresAt.toISOString()],
  );

  const base = process.env.API_PUBLIC_URL || 'https://api.celebratebanner.com';
  return {
    token,
    url: `${base}/api/downloads/${encodeURIComponent(projectId)}/${assetType}/${encodeURIComponent(token)}`,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Resolve a token into a short-lived signed S3 URL. Validates:
 *   • HMAC signature
 *   • DB row exists, not expired
 *   • Usage count below cap
 * Records usage (last_used_at / last_ip / count) on every successful resolution.
 */
async function resolveDownloadToken({ projectId, assetType, token, ip, ua }) {
  const parts = token.split('.');
  if (parts.length !== 2) throw Object.assign(new Error('malformed token'), { status: 400 });
  const expectedSig = sign(`${projectId}.${assetType}.${parts[0]}`);
  // Constant-time compare to prevent timing oracles.
  if (!crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expectedSig))) {
    throw Object.assign(new Error('invalid signature'), { status: 403 });
  }
  const row = await one(
    `SELECT id, s3_key, expires_at, used_count
       FROM download_tokens
      WHERE token_hash = $1 AND project_id = $2 AND asset_type = $3`,
    [hashToken(token), projectId, assetType],
  );
  if (!row) throw Object.assign(new Error('token revoked or not issued'), { status: 404 });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw Object.assign(new Error('token expired'), { status: 410 });
  }
  if (row.used_count >= MAX_USES) {
    throw Object.assign(new Error('token exhausted'), { status: 429 });
  }

  await query(
    `UPDATE download_tokens
        SET used_count = used_count + 1,
            last_used_at = NOW(),
            last_ip = $1,
            last_ua = $2
      WHERE id = $3`,
    [ip || null, ua ? String(ua).slice(0, 500) : null, row.id],
  );

  // Sign a 5-minute S3 GET URL — the client downloads the file directly.
  const url = await signedGet(row.s3_key, 5 * 60);
  return { url, s3Key: row.s3_key, expiresIn: 5 * 60 };
}

async function revokeProjectTokens(projectId) {
  await query(`DELETE FROM download_tokens WHERE project_id = $1`, [projectId]);
}

module.exports = { issueDownloadToken, resolveDownloadToken, revokeProjectTokens };
