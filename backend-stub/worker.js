/**
 * Render-worker entrypoint.
 *
 * The existing BullMQ worker (workers/render.worker.js) self-starts on require and installs
 * its own SIGTERM/SIGINT graceful-shutdown handlers (closes the worker + Redis connection).
 * This entrypoint only enforces required configuration first, so a misconfigured worker
 * fails clearly instead of connecting to nothing.
 */

const { assertEnv } = require('./lib/require-env');
assertEnv('worker');

const { logger } = require('./services/logger');
logger.info('render-worker.starting');

// Self-starting: creates the BullMQ Worker (concurrency = RENDER_CONCURRENCY) and registers
// SIGTERM/SIGINT handlers that close it gracefully.
require('./workers/render.worker');
