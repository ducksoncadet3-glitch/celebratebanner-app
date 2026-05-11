#!/usr/bin/env node
/**
 * Environment validator. Run as a pre-start hook in every deploy:
 *
 *   node scripts/check-env.js api      # for the API server
 *   node scripts/check-env.js worker   # for the BullMQ render worker
 *   node scripts/check-env.js recovery # for the abandoned-checkout cron
 *
 * Fails the deploy fast if a required var is missing — better than discovering
 * it at 3am because a token rotation forgot to update the worker.
 *
 * Returns exit code 0 if all required vars are present; 1 otherwise. Prints
 * a tidy table of what's set / missing.
 */

// process is global in Node — no eslint-env needed for this file.

const REQUIRED = {
  // Variables every process needs.
  common: [
    'NODE_ENV',
    'DATABASE_URL',
  ],
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
  recovery: [
    'PG_SSL',
    'PUBLIC_SITE_URL',
    'POSTMARK_API_TOKEN',
    'MAIL_FROM',
  ],
};

// Vars whose values must match a format. Mismatch = hard fail.
const PATTERNS = {
  STRIPE_SECRET_KEY:     /^sk_(test|live)_[A-Za-z0-9]+$/,
  STRIPE_WEBHOOK_SECRET: /^whsec_[A-Za-z0-9]+$/,
  DATABASE_URL:          /^postgres(ql)?:\/\//,
  REDIS_URL:             /^rediss?:\/\//,
  PUBLIC_SITE_URL:       /^https?:\/\//,
  API_PUBLIC_URL:        /^https?:\/\//,
  S3_CDN_BASE:           /^https:\/\//,
  // Secrets should be at least 24 chars of entropy.
  ADMIN_JWT_SECRET:      /^.{24,}$/,
  DOWNLOAD_TOKEN_SECRET: /^.{24,}$/,
  // Production should never run with sk_test_ — flag below.
};

const process_kind = process.argv[2] || 'api';
if (!REQUIRED[process_kind]) {
  console.error(`Unknown process kind: ${process_kind}. Choose one of: ${Object.keys(REQUIRED).join(', ')}`);
  process.exit(2);
}

const want = [...REQUIRED.common, ...REQUIRED[process_kind]];
const missing = [];
const wrong = [];
const warnings = [];

for (const key of want) {
  const v = process.env[key];
  if (!v) {
    missing.push(key);
    continue;
  }
  const pat = PATTERNS[key];
  if (pat && !pat.test(v)) wrong.push({ key, hint: pat.toString() });
}

// Warnings: production hygiene checks that aren't fatal but operators should see.
if (process.env.NODE_ENV === 'production') {
  if (/^sk_test_/.test(process.env.STRIPE_SECRET_KEY || '')) {
    warnings.push('STRIPE_SECRET_KEY is a TEST key but NODE_ENV=production');
  }
  if (process.env.PG_SSL !== 'require') {
    warnings.push('PG_SSL=require recommended in production');
  }
  if (!process.env.SENTRY_DSN) {
    warnings.push('SENTRY_DSN not set — error tracking is off');
  }
}

function row(k, ok, hint) {
  const mark = ok ? '✓' : '✗';
  const v = process.env[k];
  const display = v ? `${v.length > 12 ? v.slice(0, 8) + '…' : v}` : '<missing>';
  return `  ${mark}  ${k.padEnd(28)} ${display}${hint ? '  (' + hint + ')' : ''}`;
}

console.log(`\nEnv check · ${process_kind}\n`);
for (const k of want) {
  if (missing.includes(k)) console.log(row(k, false));
  else if (wrong.find((w) => w.key === k)) {
    const hint = wrong.find((w) => w.key === k).hint;
    console.log(row(k, false, `pattern ${hint}`));
  } else {
    console.log(row(k, true));
  }
}

if (warnings.length) {
  console.log('\nWarnings:');
  for (const w of warnings) console.log(`  ⚠  ${w}`);
}

if (missing.length || wrong.length) {
  console.log(`\n✗ env check failed — ${missing.length} missing, ${wrong.length} malformed`);
  process.exit(1);
}
console.log(`\n✓ env check passed for "${process_kind}"`);
