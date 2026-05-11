/**
 * Prometheus-style metrics. The host app exposes /metrics for scraping.
 *
 * Dependencies:
 *   "prom-client": "^15.1.3"
 *
 * If prom-client isn't installed, this module degrades to a no-op so the
 * stub is importable without dependencies. Production should install it.
 */

let client;
try {
  client = require('prom-client');
} catch {
  client = null;
}

const noop = () => {};
let registry, counters = {}, histograms = {}, gauges = {};

if (client) {
  registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry });

  counters.checkouts          = new client.Counter({ name: 'cb_checkouts_total', help: 'Stripe Checkout Sessions created', registers: [registry] });
  counters.webhookOk          = new client.Counter({ name: 'cb_webhook_ok_total', help: 'Stripe webhooks accepted', registers: [registry] });
  counters.webhookBad         = new client.Counter({ name: 'cb_webhook_bad_total', help: 'Stripe webhooks rejected (bad signature, etc.)', registers: [registry] });
  counters.uploadsRequested   = new client.Counter({ name: 'cb_uploads_requested_total', help: 'Signed upload URLs issued', registers: [registry] });
  counters.rendersEnqueued    = new client.Counter({ name: 'cb_renders_enqueued_total', help: 'HD render jobs enqueued', registers: [registry] });
  counters.renderFailures     = new client.Counter({ name: 'cb_render_failures_total', help: 'HD render attempts that ended in error', registers: [registry] });
  counters.emailsSent         = new client.Counter({ name: 'cb_emails_sent_total', help: 'Transactional emails dispatched', labelNames: ['kind'], registers: [registry] });
  counters.downloads          = new client.Counter({ name: 'cb_downloads_total', help: 'Signed downloads served', labelNames: ['kind'], registers: [registry] });

  histograms.renderDuration   = new client.Histogram({
    name: 'cb_render_duration_ms',
    help: 'HD render duration in ms',
    buckets: [500, 1000, 2000, 4000, 8000, 15000, 30000, 60000],
    registers: [registry],
  });

  gauges.queueDepth           = new client.Gauge({ name: 'cb_queue_depth', help: 'BullMQ render queue depth', labelNames: ['state'], registers: [registry] });
}

const metrics = {
  incCheckout:        () => counters.checkouts?.inc(),
  incWebhookOk:       () => counters.webhookOk?.inc(),
  incWebhookBad:      () => counters.webhookBad?.inc(),
  incUploadsRequested:() => counters.uploadsRequested?.inc(),
  incRendersEnqueued: () => counters.rendersEnqueued?.inc(),
  incRenderFailures:  () => counters.renderFailures?.inc(),
  incEmailsSent:      (kind = 'delivery') => counters.emailsSent?.inc({ kind }),
  incDownloads:       (kind = 'jpeg') => counters.downloads?.inc({ kind }),
  observeRenderDuration: (ms) => histograms.renderDuration?.observe(ms),
  setQueueDepth: (state, n) => gauges.queueDepth?.set({ state }, n),
};

async function metricsHandler(_req, res) {
  if (!client) return res.status(503).send('prom-client not installed');
  res.setHeader('Content-Type', registry.contentType);
  res.send(await registry.metrics());
}

module.exports = { metrics, metricsHandler };
