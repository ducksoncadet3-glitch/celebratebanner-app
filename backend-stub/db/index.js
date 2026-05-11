/**
 * Postgres pool + query helpers.
 *
 * Dependencies:
 *   "pg": "^8.13.0"
 *
 * Env:
 *   DATABASE_URL   — postgres connection string (RDS / Neon / Supabase)
 *   PG_POOL_SIZE   — optional, default 10
 *   PG_SSL         — "require" to enforce SSL (default on hosted Postgres)
 */

const { Pool } = require('pg');
const { logger } = require('../services/logger');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number.parseInt(process.env.PG_POOL_SIZE || '10', 10),
  ssl: process.env.PG_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  logger.error({ err: err.message }, 'pg pool error');
});

/** Run a single query and log slow ones. Use this for SELECTs in routes. */
async function query(text, params) {
  const t0 = Date.now();
  try {
    const res = await pool.query(text, params);
    const ms = Date.now() - t0;
    if (ms > 250) logger.warn({ sql: text.slice(0, 120), ms }, 'slow query');
    return res;
  } catch (err) {
    logger.error({ err: err.message, sql: text.slice(0, 120) }, 'pg query failed');
    throw err;
  }
}

/** Convenience for routes that only need rows[]. */
async function rows(text, params) {
  return (await query(text, params)).rows;
}

/** Single-row helper — returns undefined if not found. */
async function one(text, params) {
  return (await query(text, params)).rows[0];
}

/** Transaction wrapper. */
async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function shutdown() {
  await pool.end();
}

module.exports = { pool, query, rows, one, tx, shutdown };
