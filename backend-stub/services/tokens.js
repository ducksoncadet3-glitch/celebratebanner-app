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
async function issueDownloadToken({ projectId, assetType, s3Key, ttlDays = TTL_DAYS, purpose = 'delivery' }) {
  const tokenBody = b64u(crypto.randomBytes(24));
  const sig = sign(`${projectId}.${assetType}.${tokenBody}`);
  const token = `${tokenBody}.${sig}`;
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO download_tokens (project_id, asset_type, s3_key, token_hash, expires_at, purpose)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [projectId, assetType, s3Key, tokenHash, expiresAt.toISOString(), purpose],
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
  const given = Buffer.from(parts[1]);
  const expected = Buffer.from(expectedSig);
  // timingSafeEqual THROWS on a length mismatch, which turned a forged token into a 500
  // carrying a Node internal message. Length is not a secret — the signature is always the
  // same width — so check it first and answer with the same generic rejection.
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    throw Object.assign(new Error('invalid signature'), { status: 403 });
  }
  const row = await one(
    `SELECT id, s3_key, expires_at, used_count
       FROM download_tokens
      WHERE token_hash = $1 AND project_id = $2 AND asset_type = $3`,
    [hashToken(token), projectId, assetType],
  );
  if (!row) {
    // The signature verified, so THIS token was genuinely issued by us for this project —
    // a forged or guessed token never reaches here. That makes it safe to tell the holder
    // the one thing they actually need to know: their order was refunded, so the download
    // was revoked on purpose. Everything else stays generic.
    if (await projectWasRefunded(projectId)) {
      throw Object.assign(
        new Error('This download is no longer available because this order was refunded.'),
        { status: 410 },
      );
    }
    throw Object.assign(new Error('token revoked or not issued'), { status: 404 });
  }
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

/**
 * Was this project refunded? Used ONLY to explain an already-denied download in customer
 * language. It grants nothing: it runs after access has been refused, and reveals no token
 * state, S3 key, amount or payment identifier.
 */
async function projectWasRefunded(projectId) {
  try {
    const row = await one(
      `SELECT 1 AS refunded
         FROM projects p
         LEFT JOIN payments pay ON pay.project_id = p.id
        WHERE p.id = $1
          AND (p.status = 'refunded' OR pay.status = 'refunded')
        LIMIT 1`,
      [projectId],
    );
    return Boolean(row);
  } catch {
    // Never turn a lookup failure into a different outcome — fall back to the generic answer.
    return false;
  }
}

/** Revoke EVERY download for a project — what a refund does. Purpose-blind on purpose. */
async function revokeProjectTokens(projectId) {
  await query(`DELETE FROM download_tokens WHERE project_id = $1`, [projectId]);
}

/**
 * Revoke only the tokens issued for one purpose.
 *
 * Used to keep at most one live 'self_serve' token per project: the success page replaces
 * its own previous authorization on each visit and never touches the 'delivery' token the
 * customer was emailed, so both channels keep working for the life of the order.
 */
async function revokeProjectTokensByPurpose(projectId, purpose) {
  await query(
    `DELETE FROM download_tokens WHERE project_id = $1 AND purpose = $2`,
    [projectId, purpose],
  );
}

module.exports = {
  issueDownloadToken,
  resolveDownloadToken,
  revokeProjectTokens,
  revokeProjectTokensByPurpose,
};
