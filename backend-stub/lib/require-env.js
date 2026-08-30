/**
 * Startup configuration guard.
 *
 * Fails CLEARLY and immediately (exit 1) when a required production environment variable
 * is missing — a CONFIGURATION error, deliberately distinct from a transient dependency
 * failure (Postgres/Redis unreachable), which the /health/ready + /health/dependencies
 * probes report at runtime without killing the process.
 *
 * The required lists mirror scripts/check-env.js (the `npm run check` pre-start validator).
 * Keep the two in sync.
 */

const REQUIRED = {
  common: ['NODE_ENV', 'DATABASE_URL'],
  api: [
    'PG_SSL',
    'PUBLIC_SITE_URL',
    'API_PUBLIC_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'REDIS_URL',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET',
    'S3_CDN_BASE',
    'DOWNLOAD_TOKEN_SECRET',
    'POSTMARK_API_TOKEN',
    'MAIL_FROM',
    'ADMIN_JWT_SECRET',
  ],
  worker: [
    'PG_SSL',
    'REDIS_URL',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'S3_BUCKET',
    'S3_CDN_BASE',
    'DOWNLOAD_TOKEN_SECRET',
    'POSTMARK_API_TOKEN',
    'MAIL_FROM',
    'API_PUBLIC_URL',
  ],
  recovery: ['PG_SSL', 'PUBLIC_SITE_URL', 'POSTMARK_API_TOKEN', 'MAIL_FROM'],
};

function missingFor(role) {
  const names = [...REQUIRED.common, ...(REQUIRED[role] || [])];
  return names.filter((n) => {
    const v = process.env[n];
    return v === undefined || String(v).trim() === '';
  });
}

/** Assert all required env for a role is present, else exit(1) with a clear message. */
function assertEnv(role) {
  const missing = missingFor(role);
  if (missing.length > 0) {
    // Plain console (logger may not be configured yet) + non-zero exit = clear failure.
    // eslint-disable-next-line no-console
    console.error(
      `[config] FATAL: "${role}" is missing required environment variables: ${missing.join(', ')}`,
    );
    // eslint-disable-next-line no-console
    console.error(
      '[config] This is a configuration error (not a transient dependency failure). ' +
        'Set these and restart. See docs/INFRASTRUCTURE.md §6.',
    );
    process.exit(1);
  }
}

module.exports = { assertEnv, missingFor, REQUIRED };
