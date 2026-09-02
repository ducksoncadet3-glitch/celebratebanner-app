/**
 * CelebrateBanner API server (Express).
 *
 * Assembly follows README.md's canonical wiring exactly:
 *   • request-id logging (requestLogger)
 *   • Stripe webhook mounted with the RAW request body BEFORE express.json()
 *   • JSON body parser for all other routes
 *   • existing route handlers at their documented paths
 *   • /health/{live,ready,dependencies}
 *   • admin auth (login/logout/csrf open; everything else under /api/admin gated)
 *   • explicit 404 + error handler
 *   • graceful SIGTERM/SIGINT shutdown (drains HTTP, then queue + db)
 *
 * Config errors (missing required env) fail fast via assertEnv BEFORE any route module
 * loads (route modules construct the Stripe client at import). Dependency reachability is
 * NOT checked here — the health probes report that at runtime.
 */

const { assertEnv } = require('./lib/require-env');
assertEnv('api');

const express = require('express');
const { logger, requestLogger } = require('./services/logger');
const { metricsHandler } = require('./services/metrics');
const { checkoutHandler } = require('./routes/payments.checkout');
const { eventsHandler } = require('./routes/events');
const { webhookHandler, webhookRawParser } = require('./routes/payments.webhook');
const { signedUploadHandler, middlewares: uploadMw } = require('./routes/uploads.signed');
const { downloadHandler, middlewares: downloadMw } = require('./routes/downloads');
const { hdRenderHandler, hdStatusHandler } = require('./routes/render.hd');
const { previewHandler } = require('./routes/render.preview');
const projects = require('./routes/projects');
const emails = require('./routes/emails');
const admin = require('./routes/admin');
const { liveHandler, readyHandler, depsHandler } = require('./routes/health');
const { cors } = require('./middleware/cors');
const {
  loginHandler,
  logoutHandler,
  csrfHandler,
  adminAuth,
  loginRateLimit,
} = require('./middleware/admin-auth');

const app = express();
app.disable('x-powered-by');
app.use(requestLogger);

// ── CORS — strict origin allow-list, applied to every path (preflight included) ──
// Reconciles behaviour that has been live in production but absent from source; see
// middleware/cors.js. Must precede the webhook + 404 so OPTIONS never falls through.
app.use(cors);

// ── Stripe webhook — RAW body, must run BEFORE express.json() so the signature verifies ──
app.post('/api/payments/webhook', webhookRawParser, webhookHandler);

// ── JSON body parser for every other route ──────────────────────────────────
app.use(express.json({ limit: '256kb' }));

// ── Health checks (before business routes) ──────────────────────────────────
app.get('/health/live', liveHandler);
app.get('/health/ready', readyHandler);
app.get('/health/dependencies', depsHandler);

// ── Core API ────────────────────────────────────────────────────────────────
app.post('/api/payments/checkout', checkoutHandler);
// First-party funnel events (product_view only). checkout_started and purchase_completed
// are written server-side so a client cannot forge or inflate them. Rate-limited like the
// other public write endpoints.
app.post('/api/events', rateLimit('events'), eventsHandler);
app.post('/api/uploads/signed', ...uploadMw, signedUploadHandler);
app.get('/api/downloads/:projectId/:assetType/:token', ...downloadMw, downloadHandler);
app.post('/api/render/hd', hdRenderHandler);
app.get('/api/render/hd/:jobId/status', hdStatusHandler);
app.post('/api/render/preview', previewHandler);
app.get('/metrics', metricsHandler);

// Project status polling + autosave (thin wrappers over db/projects).
app.get('/api/projects/:id/status', projects.statusHandler);
app.patch('/api/projects/:id', ...projects.saveMiddlewares, projects.saveHandler);

// Internal transactional email (server-to-server only; gated by x-internal-secret).
app.post('/api/emails/order-confirmation', emails.orderConfirmationHandler);

// ── Admin auth: login/logout/csrf are open (you obtain a session here); the rest is gated ──
app.post('/api/admin/auth/login', loginRateLimit, loginHandler);
app.post('/api/admin/auth/logout', logoutHandler);
app.get('/api/admin/auth/csrf', csrfHandler);

app.use('/api/admin', adminAuth);
app.get('/api/admin/overview', admin.overviewHandler);
app.get('/api/admin/projects', admin.listProjectsHandler);
app.get('/api/admin/projects/:id', admin.getProjectHandler);
app.post('/api/admin/projects/:id/rerender', admin.rerenderHandler);
app.post('/api/admin/projects/:id/refund', admin.refundHandler);
app.post('/api/admin/projects/:id/resend-delivery', admin.resendDeliveryHandler);
app.get('/api/admin/queue', admin.queueHandler);
app.post('/api/admin/queue/:jobId/retry', admin.retryJobHandler);
app.post('/api/admin/queue/:jobId/cancel', admin.cancelJobHandler);
app.get('/api/admin/payments', admin.paymentsHandler);
app.get('/api/admin/webhooks', admin.webhookLogHandler);
app.get('/api/admin/analytics', admin.analyticsHandler);

// ── Explicit 404 ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'not found' });
});

// ── Error handler ───────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const log = req.log || logger;
  log.error({ err: err.message, status: err.status }, 'api.unhandled-error');
  res.status(err.status || 500).json({ error: 'internal error' });
});

// ── Listen ──────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info({ port: PORT }, 'api.listening');
});

// ── Graceful shutdown ───────────────────────────────────────────────────────
let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'api.shutdown.start');
  // Stop accepting new connections, then close shared resources.
  server.close(async () => {
    try {
      const { shutdown: queueShutdown } = require('./services/queue');
      const { shutdown: dbShutdown } = require('./db/index');
      await queueShutdown();
      await dbShutdown();
      logger.info('api.shutdown.done');
    } catch (err) {
      logger.error({ err: err.message }, 'api.shutdown.error');
    } finally {
      process.exit(0);
    }
  });
  // Safety net: force-exit if graceful drain stalls.
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server };
