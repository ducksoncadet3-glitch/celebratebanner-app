#!/usr/bin/env node
/**
 * Migration runner.
 *
 * Usage:
 *   node db/migrate.js              # apply all pending migrations
 *   node db/migrate.js --status     # show which migrations have been applied
 *   node db/migrate.js --create NAME # scaffold a new migration file
 *
 * Migrations live in db/migrations/NNNN_name.sql, numbered monotonically.
 * Once applied, the filename is recorded in the `schema_migrations` table —
 * we never re-run a numbered migration. Hot fixes go in new files; never
 * edit an applied migration.
 *
 * Wraps each migration in a transaction so a partial failure rolls back
 * cleanly. The runner itself is idempotent — safe to run on every deploy.
 */

const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');

const DIR = path.join(__dirname, 'migrations');

async function ensureRegistry(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checksum    TEXT NOT NULL
    );
  `);
}

function listFiles() {
  return fs.readdirSync(DIR)
    .filter((f) => /^\d{4}_.+\.sql$/.test(f))
    .sort();
}

function sha256(s) {
  return require('node:crypto').createHash('sha256').update(s).digest('hex');
}

async function applied(pool) {
  const { rows } = await pool.query(`SELECT name, checksum FROM schema_migrations ORDER BY name`);
  return new Map(rows.map((r) => [r.name, r.checksum]));
}

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PG_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await ensureRegistry(pool);
    const already = await applied(pool);
    const files = listFiles();
    let ran = 0;

    for (const file of files) {
      const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
      const checksum = sha256(sql);
      const prev = already.get(file);
      if (prev) {
        if (prev !== checksum) {
          console.error(`✗ ${file} has been MODIFIED after being applied. Refusing to run.`);
          console.error('  Migration files are append-only. Create a new file with a higher number.');
          process.exit(2);
        }
        continue;
      }
      console.log(`→ applying ${file}`);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          `INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)`,
          [file, checksum],
        );
        await client.query('COMMIT');
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`✗ ${file} failed: ${err.message}`);
        process.exit(3);
      } finally {
        client.release();
      }
    }
    console.log(ran === 0 ? '✓ schema already up to date' : `✓ applied ${ran} migration(s)`);
  } finally {
    await pool.end();
  }
}

async function status() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PG_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await ensureRegistry(pool);
    const already = await applied(pool);
    for (const file of listFiles()) {
      console.log(`${already.has(file) ? '✓' : ' '} ${file}`);
    }
  } finally {
    await pool.end();
  }
}

function create(name) {
  const safe = name.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  const files = listFiles();
  const last = files.length > 0 ? Number.parseInt(files[files.length - 1].slice(0, 4), 10) : 0;
  const next = String(last + 1).padStart(4, '0');
  const out = path.join(DIR, `${next}_${safe}.sql`);
  fs.writeFileSync(out, `-- ${next}_${safe}.sql\n-- Description: \n\n`);
  console.log(`created ${out}`);
}

const cmd = process.argv[2];
if (cmd === '--status') status();
else if (cmd === '--create') create(process.argv[3] || 'unnamed');
else migrate();
