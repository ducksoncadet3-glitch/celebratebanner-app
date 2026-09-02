'use strict';

/**
 * The server must actually START.
 *
 * A missing import in server.js is invisible to source-matching tests: the analytics deploy
 * passed every suite, then every API machine failed its health check and Fly rolled the
 * release back, because `rateLimit` was referenced in server.js without being imported.
 *
 * This test loads server.js for real under a complete dummy environment, so a
 * ReferenceError, a bad require path or a throwing top-level statement fails the build
 * instead of the deploy.
 *
 * It only requires the module — it starts no listener, opens no socket, and talks to no
 * external service. Dependency-free, so it runs in the pre-deploy suite.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

/**
 * The pre-deploy suite runs `node --test` with NO npm install, so server.js (express,
 * stripe, pg…) cannot be loaded there. When dependencies are absent these checks skip; the
 * deploy workflow installs production deps and runs the same boot check before releasing,
 * which is the gate that actually protects a release.
 */
const DEPS_INSTALLED = fs.existsSync(path.join(__dirname, '..', 'node_modules', 'express'));

/** A complete, obviously-fake environment: enough to satisfy assertEnv, connects nowhere. */
const DUMMY_ENV = {
  // production, to match the deploy gate: NODE_ENV=test loads pino-pretty, a devDependency
  // the production install does not include.
  NODE_ENV: 'production',
  PORT: '0',
  DATABASE_URL: 'postgres://user:pass@127.0.0.1:5432/db',
  PG_SSL: 'disable',
  PUBLIC_SITE_URL: 'https://example.test',
  API_PUBLIC_URL: 'https://api.example.test',
  STRIPE_SECRET_KEY: 'sk_test_dummy',
  STRIPE_WEBHOOK_SECRET: 'whsec_dummy',
  REDIS_URL: 'redis://127.0.0.1:6379',
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'dummy',
  AWS_SECRET_ACCESS_KEY: 'dummy',
  S3_BUCKET: 'dummy-bucket',
  S3_CDN_BASE: 'https://cdn.example.test',
  DOWNLOAD_TOKEN_SECRET: 'd'.repeat(32),
  POSTMARK_API_TOKEN: 'dummy',
  MAIL_FROM: 'CelebrateBanner <noreply@example.test>',
  ADMIN_JWT_SECRET: 'a'.repeat(32),
};

test('server.js loads without throwing (catches missing imports)', { skip: !DEPS_INSTALLED && 'dependencies not installed' }, () => {
  const root = path.join(__dirname, '..');
  let output = '';
  try {
    output = execFileSync(
      process.execPath,
      // Exit as soon as it loads: server.js starts a listener and ioredis retries
      // forever, so without this the child never exits and the check times out.
      ['-e', "require('./server.js'); console.log('BOOT_OK'); process.exit(0);"],
      {
        cwd: root,
        env: { ...process.env, ...DUMMY_ENV },
        encoding: 'utf8',
        timeout: 30000,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
  } catch (err) {
    const detail = [err.stdout, err.stderr].filter(Boolean).join('\n').slice(0, 1200);
    assert.fail(`server.js failed to load:\n${detail}`);
  }
  assert.match(output, /BOOT_OK/, 'server.js must load cleanly');
});

test('every route module referenced by server.js resolves', { skip: !DEPS_INSTALLED && 'dependencies not installed' }, () => {
  // A require of a path that does not exist is the other way a deploy dies on boot.
  const root = path.join(__dirname, '..');
  const script = [
    "const fs=require('node:fs');",
    "const src=fs.readFileSync('./server.js','utf8');",
    "const re=/require\\('(\\.\\/[^']+)'\\)/g;",
    'let m, bad=[];',
    'while ((m = re.exec(src))) { try { require.resolve(m[1]); } catch { bad.push(m[1]); } }',
    "console.log(bad.length ? 'UNRESOLVED:' + bad.join(',') : 'ALL_RESOLVE');",
  ].join('');
  const out = execFileSync(process.execPath, ['-e', script], {
    cwd: root, env: { ...process.env, ...DUMMY_ENV }, encoding: 'utf8', timeout: 30000,
  });
  assert.match(out, /ALL_RESOLVE/, out.trim());
});
