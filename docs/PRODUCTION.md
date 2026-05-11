# Production deployment guide

What it takes to go from "code merged" → "zero manual intervention" on the
end-to-end flow: **upload → preview → payment → HD render → delivery**.

## Architecture

```
celebratebanner-app  (this repo)
├── index.html                      legacy single-file app (still serving today)
├── web/                            Next.js 15 frontend
├── shared/render-engine/           shared rendering package
└── backend-stub/                   drop-in code for celebratebanner-api
└── admin-stub/                     drop-in code for celebratebanner-admin

celebratebanner-api  (other repo)
└── reads from backend-stub/

celebratebanner-admin  (other repo)
└── reads from admin-stub/
```

The render engine is a workspace package. Both web/ and celebratebanner-api
import it via `file:` protocol; published as `@celebratebanner/render-engine`
once we move it to a registry.

## Infrastructure I need from you

| Resource         | Provider suggestion           | Sized for                  |
| ---------------- | ----------------------------- | -------------------------- |
| Postgres 16      | Neon (free tier) or RDS       | <10 GB to start            |
| Redis            | Upstash (free tier) or ElastiCache | <100 MB                 |
| S3 + CloudFront  | AWS                           | 10–50 GB images/mo         |
| API host         | Fly.io / Railway / Render     | 1× 2 GB instance           |
| Worker host      | Same provider, SEPARATE process | 2× 1 GB instances        |
| Email            | Postmark / Resend             | <10k tx/mo                 |
| Stripe webhook   | Stripe dashboard              | one prod endpoint          |
| Sentry           | sentry.io free tier           | error reporting            |

Cost at launch volume: ~$15-30/mo before AWS, ~$50-80/mo with AWS.

## Deploy order

1. **Provision Postgres**. Note the connection string.
2. **Provision Redis**. Note the URL.
3. **Provision S3**:
   - Create bucket `celebratebanner-uploads-prod`
   - Enable CORS: allow `POST` from `https://celebratebanner.com` and your dev URLs
   - Create CloudFront distribution in front of it
   - Create IAM user with `s3:PutObject`, `s3:GetObject` on the bucket only
4. **Deploy celebratebanner-api**:
   - Copy `backend-stub/` files into the api repo (see `backend-stub/README.md`)
   - Fill in env vars from `backend-stub/env.example`
   - Apply schema: `psql $DATABASE_URL -f db/schema.sql`
   - Deploy API process and worker process separately
   - Verify `/metrics` endpoint serves Prom output
5. **Configure Stripe**:
   - Webhook endpoint → `https://api.celebratebanner.com/api/payments/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `charge.refunded`
   - Copy signing secret into `STRIPE_WEBHOOK_SECRET`
6. **Configure Postmark**:
   - Verify sender domain `celebratebanner.com` (SPF/DKIM/Return-Path)
   - Copy server token into `POSTMARK_API_TOKEN`
7. **Deploy /web**:
   - Create separate Vercel project pointed at `/web` subdirectory
   - Fill in env vars from `web/.env.example` (API URL, Stripe pk, etc.)
   - Domain: start `web-celebratebanner.vercel.app`, promote to
     `app.celebratebanner.com` when validated
8. **Deploy celebratebanner-admin**:
   - Copy `admin-stub/` files into the admin repo
   - Implement admin API endpoints in celebratebanner-api (see
     `admin-stub/README.md`)
   - Deploy behind your admin SSO

## End-to-end test script

Run after every prod deploy:

```bash
# 1. Health
curl https://api.celebratebanner.com/metrics | head

# 2. Create a project + upload a tiny test image
PROJECT=proj_test$(date +%s)
SHA=$(echo -n 'test' | sha256sum | cut -d' ' -f1)
curl -sX POST https://api.celebratebanner.com/api/uploads/signed \
  -H 'content-type: application/json' \
  -d "{\"projectId\":\"$PROJECT\",\"filename\":\"x.png\",\"contentType\":\"image/png\",\"bytes\":100,\"sha256\":\"$SHA\",\"width\":1,\"height\":1}"

# 3. Trigger a Stripe webhook test from the dashboard.
#    Confirm in admin: project moves pending → paid → rendering → ready.

# 4. Visit the email link, confirm it 302s to S3 and the file downloads.
```

## SLOs to monitor

| Signal                            | Target           | Alert at         |
| --------------------------------- | ---------------- | ---------------- |
| API p95 latency                   | < 300 ms         | > 800 ms / 5 min |
| Stripe webhook acceptance         | > 99%            | < 95% / 1 hr     |
| Render success rate               | > 99%            | < 95% / 1 hr     |
| Render p95 duration               | < 8 s            | > 20 s / 1 hr    |
| Queue depth (waiting)             | < 20             | > 100 / 5 min    |
| S3 upload success rate            | > 99%            | < 95% / 1 hr     |

Prometheus rules + Grafana dashboards live in `backend-stub/services/metrics.js`.

## Migration from the legacy static Stripe link

The current live site (`celebratebanner-app.vercel.app`) uses a static Stripe
payment link. The new flow uses dynamic Checkout Sessions. Cut over:

1. Both flows work simultaneously while migrating — the new frontend falls
   back to the legacy link on API 5xx via `NEXT_PUBLIC_LEGACY_STRIPE_LINK`.
2. Once new flow has been stable for ~1 week, remove the env var.
3. Disable the static payment link in the Stripe dashboard.

## What's untouched

- `index.html` keeps serving from `celebratebanner-app.vercel.app` unchanged.
- The render engine is additive infrastructure — no business logic depends
  on it until the new Vercel deploy of `/web` goes live.
- This guide doesn't touch DNS. Coordinate that separately when promoting
  `app.celebratebanner.com` to the new app.
