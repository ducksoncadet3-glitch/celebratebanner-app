# backend-stub — drop-in code for celebratebanner-api

Production-grade backend for CelebrateBanner. Drop into the
`celebratebanner-api` repository, wire to your Express (or Fastify) app, and
you have the full upload → preview → payment → HD render → delivery loop
without any business logic in the frontend.

## Layout

```
backend-stub/
├── env.example                       # ALL server env vars
├── db/
│   ├── schema.sql                    # one-shot bootstrap (equivalent to migrations 0001)
│   ├── migrate.js                    # versioned migration runner (idempotent, checksum-guarded)
│   ├── migrations/
│   │   ├── 0001_initial.sql          # core tables: users, projects, uploads, renders, payments, download_tokens
│   │   ├── 0002_webhook_events.sql   # Stripe webhook idempotency table
│   │   └── 0003_audit_log.sql        # append-only audit log
│   ├── index.js                      # pg pool + query/tx helpers
│   ├── projects.js                   # project repository
│   └── webhook-events.js             # Stripe replay-protection helpers
├── services/
│   ├── logger.js                     # pino structured logger
│   ├── metrics.js                    # prom-client (exposes /metrics)
│   ├── s3.js                         # presigned uploads + signed GETs
│   ├── queue.js                      # BullMQ wrapper (production)
│   ├── tokens.js                     # HMAC-signed download tokens
│   ├── mailer.js                     # transactional email via template files
│   ├── audit.js                      # audit_log helper
│   ├── image-optimizer.js            # sharp-based thumb/medium variants
│   ├── projects.js                   # facade — delegates to db/projects.js
│   ├── render.js                     # node-canvas render via shared engine
│   └── render-queue.js               # DEPRECATED — in-memory fallback for local dev only
├── email/templates/
│   ├── delivery.js                   # banner-ready email
│   ├── recovery.js                   # abandoned-checkout recovery email
│   └── failure.js                    # async-payment-failed email
├── middleware/
│   ├── rate-limit.js                 # token-bucket rate limiter (Redis-backed)
│   └── validate.js                   # Zod request validator
├── routes/
│   ├── payments.checkout.js          # POST /api/payments/checkout
│   ├── payments.webhook.js           # POST /api/payments/webhook (idempotency + audit)
│   ├── uploads.signed.js             # POST /api/uploads/signed + auto-optimizer trigger
│   ├── downloads.js                  # GET  /api/downloads/:projectId/:assetType/:token
│   ├── render.hd.js                  # POST /api/render/hd
│   ├── render.preview.js             # POST /api/render/preview
│   └── admin.js                      # GET/POST /api/admin/* (every endpoint the admin dashboard calls)
├── workers/
│   ├── render.worker.js              # BullMQ render worker
│   └── abandoned-checkout.worker.js  # abandoned-cart recovery cron
├── video/
│   └── encoder.js                    # ffmpeg-based MP4 slideshow ($19 upsell)
└── utils/
    └── render-input.js               # Zod schema + version migration (mirror of web/lib/render-input.schema.ts)
```

## Install

```bash
npm install \
  stripe@^17 \
  pg@^8.13 \
  ioredis@^5.4 \
  bullmq@^5.34 \
  @aws-sdk/client-s3@^3.700 \
  @aws-sdk/s3-presigned-post@^3.700 \
  @aws-sdk/s3-request-presigner@^3.700 \
  zod@^3.23 \
  pino@^9.5 \
  pino-pretty@^11.3 \
  prom-client@^15.1 \
  rate-limiter-flexible@^5.0 \
  fluent-ffmpeg@^2.1 \
  canvas@^3
# OR
# npm install skia-canvas@^2  (better text rendering, swap inside services/render.js)
```

Plus the engine itself:

```bash
npm install ../celebratebanner-app/shared/render-engine
# Or once published:
# npm install @celebratebanner/render-engine
```

Plus sharp for image variants:

```bash
npm install sharp@^0.33
```

## Apply migrations

```bash
# First deploy + every subsequent deploy. Idempotent and checksum-guarded
# (refuses to run a migration that's been modified after it was applied).
node db/migrate.js

# Inspect pending vs applied
node db/migrate.js --status

# Create a new migration
node db/migrate.js --create rename_thing
```

`db/schema.sql` is a one-shot bootstrap that produces the same state as
running migrations `0001`. Use it for ephemeral test databases; production
should always use the migrate runner so the `schema_migrations` ledger stays
in sync.

## Wire into your Express app

```js
// celebratebanner-api/src/app.js
import express from 'express';
import { logger, requestLogger } from './services/logger.js';
import { metricsHandler } from './services/metrics.js';
import { checkoutHandler } from './routes/payments.checkout.js';
import { webhookHandler, webhookRawParser } from './routes/payments.webhook.js';
import { signedUploadHandler, middlewares as uploadMw } from './routes/uploads.signed.js';
import { downloadHandler, middlewares as downloadMw } from './routes/downloads.js';
import { hdRenderHandler, hdStatusHandler } from './routes/render.hd.js';
import { previewHandler } from './routes/render.preview.js';
import * as admin from './routes/admin.js';
import { adminAuth } from './middleware/admin-auth.js'; // YOUR auth — Clerk, Auth.js, bearer, etc.

const app = express();
app.disable('x-powered-by');
app.use(requestLogger);

// Stripe webhook RAW BODY — must run BEFORE express.json().
app.post('/api/payments/webhook', webhookRawParser, webhookHandler);

app.use(express.json({ limit: '256kb' }));

app.post('/api/payments/checkout',        checkoutHandler);
app.post('/api/uploads/signed',           ...uploadMw, signedUploadHandler);
app.get ('/api/downloads/:projectId/:assetType/:token', ...downloadMw, downloadHandler);
app.post('/api/render/hd',                hdRenderHandler);
app.get ('/api/render/hd/:jobId/status',  hdStatusHandler);
app.post('/api/render/preview',           previewHandler);
app.get ('/metrics',                      metricsHandler);

// Admin — every route in here MUST be gated by your auth. The admin user is
// expected on req.user; routes/admin.js writes req.user.id into audit_log.
app.use('/api/admin', adminAuth);
app.get ('/api/admin/overview',                       admin.overviewHandler);
app.get ('/api/admin/projects',                       admin.listProjectsHandler);
app.get ('/api/admin/projects/:id',                   admin.getProjectHandler);
app.post('/api/admin/projects/:id/rerender',          admin.rerenderHandler);
app.post('/api/admin/projects/:id/refund',            admin.refundHandler);
app.post('/api/admin/projects/:id/resend-delivery',   admin.resendDeliveryHandler);
app.get ('/api/admin/queue',                          admin.queueHandler);
app.post('/api/admin/queue/:jobId/retry',             admin.retryJobHandler);
app.post('/api/admin/queue/:jobId/cancel',            admin.cancelJobHandler);
app.get ('/api/admin/payments',                       admin.paymentsHandler);
app.get ('/api/admin/webhooks',                       admin.webhookLogHandler);

// Graceful shutdown
async function shutdown(signal) {
  logger.info({ signal }, 'api.shutdown.start');
  const { shutdown: queueShutdown } = await import('./services/queue.js');
  const { shutdown: dbShutdown }    = await import('./db/index.js');
  await queueShutdown();
  await dbShutdown();
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
```

## Run the workers SEPARATELY

Three Node processes per environment:

```bash
# 1) API server (Express)
node src/app.js

# 2) BullMQ render worker (HD renders + slideshow encoding)
node workers/render.worker.js

# 3) Abandoned-checkout recovery cron (low CPU, no Redis required)
node workers/abandoned-checkout.worker.js
```

Workers and API share env + Redis + Postgres but should be deployed as
distinct processes (Fly.io worker, ECS task, Railway service) so HD renders
never starve the API request thread.

## Deploy checklist

1. **Postgres** — provision RDS / Neon. Run `db/schema.sql`. Set `DATABASE_URL`.
2. **Redis** — provision ElastiCache / Upstash. Set `REDIS_URL`.
3. **S3** — create bucket (e.g. `celebratebanner-uploads-prod`), enable CORS for
   POST from your domains. Front with CloudFront for CDN + signed-URL caching.
   Set `S3_BUCKET`, `S3_CDN_BASE`, AWS keys.
4. **Stripe** — register webhook endpoint
   `https://api.celebratebanner.com/api/payments/webhook` subscribed to
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `charge.refunded`. Copy the
   signing secret into `STRIPE_WEBHOOK_SECRET`.
5. **Postmark** (or your transactional mail provider) — verify
   `info@celebratebanner.com` sender, set `POSTMARK_API_TOKEN`.
6. **Download tokens** — generate a 32-byte random secret:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
   and put it in `DOWNLOAD_TOKEN_SECRET`. Rotating this invalidates every
   outstanding download link.
7. **Render concurrency** — start at `RENDER_CONCURRENCY=2`. Each in-flight
   HD render peaks around 600 MB RAM. Tune based on worker instance size.
8. **FFmpeg** — `apt install ffmpeg` (or use `@ffmpeg-installer/ffmpeg`).
   Required for the video slideshow upsell.
9. **Sentry** (recommended) — set `SENTRY_DSN`; the logger will forward errors.
10. **Prometheus / Grafana** — scrape `/metrics`. Alert on
    `cb_render_failures_total` rate-of-change and `cb_queue_depth{state="failed"}`.

## End-to-end flow

```
[Browser] PhotoUploadTray
   │
   │ POST /api/uploads/signed                  (rate-limited, Zod-validated)
   ▼
[API] insert into uploads (idempotent on sha256)
   │ returns presigned POST + assetUrl
   ▼
[Browser] uploads file DIRECTLY to S3
   │
   │ PATCH /api/projects/:id   (autosave RenderInput, debounced 5s)
   ▼
[API] update projects.render_input + bump rev
   │
[Browser] CheckoutButton → POST /api/payments/checkout
   │
[API] re-prices server-side, creates Stripe Checkout Session
   │
[Customer] pays in Stripe Checkout → redirect /success
   │
[Stripe] webhook POST /api/payments/webhook
   │
[API] verify signature → markPaid in Postgres → enqueueRender(BullMQ)
   │     (dedupe key = stripe_session_id, idempotent under webhook retries)
   ▼
[Worker] dequeue → renderBannerHD → renderStandMockupBuffer →
         [optional] renderVideoSlideshow → upload outputs to S3 →
         markReady → issueDownloadToken (HMAC + DB row) → sendDeliveryEmail
   │
[Customer] receives email with signed URLs → clicks
   │
[API] GET /api/downloads/:projectId/:assetType/:token
   │     verify HMAC + DB row + expiry + usage cap → log usage →
   │     302 to S3 signed GET (5-min TTL)
   ▼
[Customer] downloads file from S3 / CloudFront edge
```

Zero manual intervention from the moment Stripe webhook fires.

## Security posture

- **No Stripe secrets in /web**. Server-side amounts only. Webhook signature
  verified before any DB write.
- **Uploads go direct to S3** via presigned POST with content-length-range +
  Content-Type constraints in the policy. Bytes never touch our API.
- **Download tokens** are HMAC-signed (timing-safe compare) AND DB-row-gated.
  Usage capped per token to discourage link sharing.
- **Rate limits** on every public endpoint backed by Redis (`fail-open` if
  Redis is down to avoid taking the site down with a stuck limiter).
- **Refunds** automatically `revokeProjectTokens(projectId)` so refunded
  customers lose access to download links.
- **Pino redacts** authorization headers, cookies, Stripe secrets, password
  fields from all log lines.

## Operational hardening

- Render worker has a per-job timeout (`RENDER_TIMEOUT_MS`, default 5 min)
  and BullMQ retry policy (`attempts=3`, exponential backoff).
- Workers handle `SIGTERM` / `SIGINT` for graceful shutdown — they finish
  the active job, then exit. Combine with rolling deploys for zero-loss.
- `markFailed` is called inside the worker's catch block so the project row
  reflects the last error message; the admin dashboard surfaces it for ops.
- Stalled job detection is on (BullMQ default). The admin dashboard's queue
  page exposes a "Retry" button for failed jobs.
- `/metrics` exposes Prometheus counters + a render-duration histogram so you
  can alert on `histogram_quantile(0.95, cb_render_duration_ms)` > 10s.

## What's NOT in this drop

These need follow-up work on celebratebanner-api directly:

- **Admin API endpoints** the admin-stub/ dashboard expects (`/api/admin/overview`,
  `/api/admin/projects`, `/api/admin/queue/*`, `/api/admin/payments`). Trivial
  SQL queries on top of the schema in `db/schema.sql` — listed in `admin-stub/README.md`.
- **CORS configuration** — depends on your origin allowlist.
- **Auth** — endpoints currently trust the request. Add Clerk / Auth.js / your
  identity provider in `middleware/auth.js` and gate the `/api/admin/*` routes.
- **CSP** — set Content-Security-Policy headers based on your CDN domains.
- **Database migrations runner** — for now `schema.sql` is idempotent. Adopt
  Sqitch / Flyway / node-pg-migrate once the schema starts churning.
