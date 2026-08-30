/**
 * Recovery-worker entrypoint (abandoned-checkout email cron).
 *
 * The existing recovery worker (workers/abandoned-checkout.worker.js) self-starts on
 * require (setInterval loop) and installs its own SIGTERM/SIGINT graceful-shutdown handlers.
 * This entrypoint only enforces required configuration first.
 */

const { assertEnv } = require('./lib/require-env');
assertEnv('recovery');

const { logger } = require('./services/logger');
logger.info('recovery-worker.starting');

// Self-starting: begins the periodic abandoned-checkout scan and registers shutdown handlers.
require('./workers/abandoned-checkout.worker');
