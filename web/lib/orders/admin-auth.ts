/**
 * Minimal admin authorization for the ops queue.
 *
 * This is a lightweight internal tool, not a public surface — a single shared token
 * (ADMIN_API_TOKEN) gates it. Behavior:
 *   • token configured  → requests must present it (x-admin-token header or admin_token
 *     cookie / ?key= for the page). Non-matching → denied.
 *   • token NOT configured → DENIED when NODE_ENV=production (fail closed); allowed only
 *     outside production, where the UI shows an "unsecured" banner.
 *     Production MUST set ADMIN_API_TOKEN or the queue is unreachable.
 *
 * Real SSO/bearer auth lives in the backend (middleware/admin-auth.js); this mirrors its
 * intent at the edge without pulling in that dependency.
 */

const ENV_TOKEN = () => process.env.ADMIN_API_TOKEN?.trim() || '';

/** Dev convenience only. In production an unset token must DENY, never allow. */
const ALLOW_UNCONFIGURED = process.env.NODE_ENV !== 'production';

export function adminTokenConfigured(): boolean {
  return ENV_TOKEN().length > 0;
}

/** Constant-time-ish compare (length-guarded) — the token is short and low-value, but
 * we avoid an early-exit char compare out of habit. */
function tokenMatches(provided: string): boolean {
  const expected = ENV_TOKEN();
  if (!expected) return ALLOW_UNCONFIGURED; // unset: allowed in dev, DENIED in production
  if (!provided || provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

/** Extract the token from a request (header first, then cookie). */
function readToken(req: Request): string {
  const header = req.headers.get('x-admin-token');
  if (header) return header.trim();
  const cookie = req.headers.get('cookie') ?? '';
  const m = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]).trim() : '';
}

/** For API route handlers. */
export function isAuthorized(req: Request): boolean {
  return tokenMatches(readToken(req));
}

/** For the server page, where the token may arrive via ?key= or the cookie. */
export function isKeyAuthorized(key: string | undefined): boolean {
  return tokenMatches((key ?? '').trim());
}
