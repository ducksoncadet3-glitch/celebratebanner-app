/**
 * CORS — RECONCILIATION of behaviour that is live in production but was never in source.
 *
 * The deployed `celebratebanner-api` emits CORS headers that exist in no repository and no
 * git history (`git log --all -S "Access-Control"` → empty). Its route surface is otherwise
 * identical to this server.js, so production is best explained as this image plus a CORS
 * middleware added outside version control. Rebuilding from source WITHOUT this file would
 * silently drop CORS and break every browser call from the app — a worse outage than the bug
 * it was added for. This file makes the API reproducible again.
 *
 * The policy below is not invented: every value was measured against
 * https://api.celebratebanner.com on 2026-08-30.
 *
 *   Origin allow-list   exactly https://app.celebratebanner.com
 *                       (www, apex, localhost and unknown origins all receive NO
 *                        Access-Control-Allow-Origin — verified)
 *   Vary                Origin
 *   Allow-Headers       Content-Type, Authorization, X-Internal-Secret
 *   Allow-Methods       GET, POST, PATCH, OPTIONS
 *   Preflight           204, empty body, on EVERY path (runs before the 404 handler)
 *   Credentials         not sent — tokens travel in Authorization, never cookies
 *
 * The single deliberate change from observed production is adding X-Project-Token to the
 * allow-list. `services/project-token.js` documents `x-project-token` as an accepted
 * credential channel, but it was missing from the allow-list, so the browser preflight
 * blocked it. The web client now uses `Authorization: Bearer` (which was already allowed),
 * so this is defence in depth, not the fix itself.
 *
 * Origins are configurable via CORS_ALLOWED_ORIGINS (comma-separated). The default matches
 * production exactly, so deploying without setting it changes nothing.
 */

const DEFAULT_ALLOWED_ORIGINS = ['https://app.celebratebanner.com'];

const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Internal-Secret, X-Project-Token';
const ALLOWED_METHODS = 'GET, POST, PATCH, OPTIONS';

/** Parse the allow-list once per call so tests can vary the env without re-requiring. */
function allowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw || !raw.trim()) return DEFAULT_ALLOWED_ORIGINS;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Strict allow-list CORS. Never reflects an arbitrary origin and never uses a wildcard:
 * an unknown origin simply receives no Access-Control-Allow-Origin, which is what makes
 * the browser block it.
 */
function cors(req, res, next) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins().includes(origin)) {
    // Vary is set only on allowed responses, matching production byte-for-byte (a
    // disallowed origin gets no Vary there either). Setting it unconditionally would be
    // marginally more cache-correct; it is deliberately NOT changed here, because the
    // point of this file is to reproduce production, not to alter it. Revisit separately.
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
  }

  // Preflight terminates here for every path, matching production (204, no body).
  if (req.method === 'OPTIONS') return res.status(204).end();
  return next();
}

module.exports = { cors, allowedOrigins, ALLOWED_HEADERS, ALLOWED_METHODS, DEFAULT_ALLOWED_ORIGINS };
