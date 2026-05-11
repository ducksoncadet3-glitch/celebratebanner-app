# Infrastructure setup — step by step

Every external system the app needs, with exact commands. Work through this
top-to-bottom once per environment (staging, prod). Total time the first time:
~3 hours.

The instructions are vendor-opinionated to keep them concrete. Equivalents on
other providers are footnoted; the env vars stay the same.

> **Sizing target** for these defaults: 0–500 paid orders/month. Bump every
> "size" line when you exit that range — the architecture scales horizontally
> without code changes.

---

## 1. PostgreSQL

**Recommended:** Neon. Free tier covers launch; auto-scales; built-in PITR.
(Equivalents: RDS Postgres 16, Supabase, Render Postgres.)

### Setup

```bash
# 1. Create a Neon project at https://console.neon.tech/
# 2. In the project: enable Point-in-Time Recovery (Settings → Backups).
# 3. Create two branches: `main` (production) and `preview` (staging).
# 4. Copy the connection string for the `main` branch — pin it to a
#    "Pooler" connection (port 5432 with -pooler in the host) so we don't
#    exhaust connections from serverless instances.
```

### Sizing

| Stage         | Compute     | Storage | Notes                                  |
| ------------- | ----------- | ------- | -------------------------------------- |
| Launch        | 0.25 vCPU autoscaling | 10 GB | Free tier is enough              |
| 500 orders/mo | 0.5 vCPU            | 25 GB | Move to paid plan ($19/mo)       |
| 5k orders/mo  | 2 vCPU              | 100 GB| Consider read replica for admin  |

### Apply schema

```bash
# Set the connection string locally for the migration run, then RUN MIGRATIONS:
export DATABASE_URL='postgres://user:pass@ep-xxx-pooler.us-east-1.aws.neon.tech/celebratebanner?sslmode=require'
export PG_SSL=require
cd celebratebanner-api
node db/migrate.js
# Verify
node db/migrate.js --status
```

### Security

- **SSL required** — set `PG_SSL=require`. Reject any host you can connect to
  without TLS.
- **Connection cap** — Neon poolers cap automatically. For raw RDS, set
  `max_connections = 200` and `PG_POOL_SIZE = (max_connections / processes)`.
- **Role isolation** — create a separate `migrator` role that owns the schema
  (used by `db/migrate.js`) and an `app` role that only has DML on the tables.

```sql
CREATE ROLE app_user WITH LOGIN PASSWORD 'rotate_me';
GRANT CONNECT ON DATABASE celebratebanner TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
```

Use the `app_user` connection string for `DATABASE_URL` on the API + worker
processes. Keep a separate `MIGRATOR_DATABASE_URL` set only on the CI runner.

### Backups + recovery

See `scripts/backup-postgres.sh` for the canonical pg_dump command, and
`scripts/verify-backup.sh` for monthly restore drills.

---

## 2. Redis (BullMQ + rate limiter)

**Recommended:** Upstash Redis (free tier covers <500 commands/sec).
(Equivalents: ElastiCache, Render Redis, Railway Redis.)

### Setup

```bash
# 1. Create an Upstash database at https://console.upstash.com/
# 2. Use the "Regional" type (not Global) — BullMQ doesn't need global replication.
# 3. Pick the SAME region as your worker process (eu-west-1 ↔ eu-west-1).
# 4. Enable TLS. Copy the rediss:// URL with the password embedded.
```

### Sizing

| Stage         | Memory  | Bandwidth      |
| ------------- | ------- | -------------- |
| Launch        | 256 MB  | 100 commands/s |
| 500 orders/mo | 256 MB  | 200 commands/s |
| 5k orders/mo  | 512 MB  | 500 commands/s |

BullMQ keeps completed jobs for 24h + 1000 most recent; failed jobs for 7d.
Memory pressure from a stuck queue is the usual culprit if you blow past
these numbers.

### Security

- **TLS only** — use the `rediss://` URL, never plain `redis://`.
- **No public exposure** — Upstash issues a public URL but rate-limits by IP.
  For ElastiCache, put it inside the same VPC as the API/worker.
- **Single key namespace** — set `RENDER_QUEUE_NAME=cb-renders` to prevent
  collision if you ever share Redis across services.

---

## 3. AWS S3 + CloudFront

The uploads + renders bucket and the CDN that serves it.

### Bucket setup

```bash
# Replace BUCKET and REGION as needed.
BUCKET=celebratebanner-uploads-prod
REGION=us-east-1

# 1. Create the bucket with versioning + block-public-access.
aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
aws s3api put-bucket-versioning --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# 2. Apply CORS so the browser can POST direct uploads.
aws s3api put-bucket-cors --bucket "$BUCKET" \
  --cors-configuration file://backend-stub/infra/s3-cors.json

# 3. Apply lifecycle rules (transition originals to Glacier after 90 days).
aws s3api put-bucket-lifecycle-configuration --bucket "$BUCKET" \
  --lifecycle-configuration file://backend-stub/infra/s3-lifecycle.json
```

### IAM user

Create an IAM user `celebratebanner-api` with the minimal policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::celebratebanner-uploads-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::celebratebanner-uploads-prod"
    }
  ]
}
```

Generate keys; set as `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` env on
the API + worker. **Never give the user `s3:DeleteBucket` or wildcard
permissions** — they shouldn't have the keys to wipe the bucket.

### CloudFront

```bash
# 1. Create a distribution from the AWS console:
#    - Origin: S3 bucket (use the REST endpoint, not the website endpoint)
#    - Origin access: "Origin access control" (OAC) — auto-generated policy
#    - Viewer protocol: redirect HTTP → HTTPS
#    - Allowed methods: GET, HEAD
#    - Cache behavior default: CachingOptimized (Managed)
#    - Price class: "Use only North America and Europe" unless you serve globally
#
# 2. After creation, copy the distribution domain (dxxxx.cloudfront.net) and
#    set as S3_CDN_BASE in env. Once you've added a custom domain
#    (cdn.celebratebanner.com), point S3_CDN_BASE there instead.
#
# 3. Origin Access Control bucket policy — apply via console:
#    AWS auto-generates it when you set OAC, just click "Copy policy"
#    and paste into the bucket's permissions tab.
```

### Sizing notes

S3 + CloudFront scale to TB without intervention. Cost at launch ($5/mo):
~10 GB stored + 50 GB transferred. Each 24×36 banner PNG is ~10 MB.

### Security

- **No public bucket policy** — CloudFront accesses via OAC, never directly.
- **Signed download URLs** — issued by `services/tokens.js` with 5-min TTL.
- **Origin shield** — enable in CloudFront if your traffic is regional; cuts
  origin requests dramatically.

---

## 4. Stripe webhook

```
1. Stripe Dashboard → Developers → Webhooks → "+ Add endpoint"
2. URL:    https://api.celebratebanner.com/api/payments/webhook
3. Events:
     • checkout.session.completed
     • checkout.session.async_payment_succeeded
     • checkout.session.async_payment_failed
     • charge.refunded
4. After saving, click "Reveal signing secret" — set as STRIPE_WEBHOOK_SECRET
   on the API process (NOT the worker).
5. (Recommended) Toggle "Send each event to all enabled endpoints" off; route
   only the four events above so you don't waste handler invocations.
```

The webhook is replay-safe (idempotency table) so retries are no-ops.

---

## 5. DNS + SSL

Three host records to set on `celebratebanner.com`:

| Host                       | Type  | Value                                           | TTL |
| -------------------------- | ----- | ----------------------------------------------- | --- |
| `app.celebratebanner.com`  | CNAME | the host running /web (Cloudflare Pages / Fly)  | 300 |
| `api.celebratebanner.com`  | CNAME | the host running celebratebanner-api            | 300 |
| `admin.celebratebanner.com`| CNAME | the host running celebratebanner-admin          | 300 |
| `cdn.celebratebanner.com`  | CNAME | the CloudFront distribution                     | 300 |

SSL: all four hosts must terminate TLS. Recommended: ACM certificate at the
host level (Cloudflare/Fly/Vercel auto-provision via ACME). For CloudFront,
issue an ACM cert in **us-east-1** (CloudFront is global but pulls certs from
us-east-1) and attach to the distribution.

Keep `celebratebanner.com` (apex) and `www.celebratebanner.com` pointing at
the current legacy `index.html` until cutover. Then change `app.` → apex.

### Cutover plan

```
PRE-CUTOVER  (legacy live)
  celebratebanner.com           → static index.html (Vercel project A)
  app.celebratebanner.com       → /web Next.js     (Vercel project B / Cloudflare Pages)
  api.celebratebanner.com       → celebratebanner-api

CUTOVER  (DNS swap, < 5 min downtime per record at TTL 300)
  celebratebanner.com           → /web Next.js     (the new app)
  legacy.celebratebanner.com    → static index.html (retain for 30 days)
```

Use the smoke test (`scripts/smoke-test.js`) immediately after each DNS swap.

---

## 6. Environment variables — every var, every process

The single source of truth is `backend-stub/env.example` + `web/.env.example`.
This is the matrix of which process needs which.

| Variable                          | api | worker | recovery | web |
| --------------------------------- | --- | ------ | -------- | --- |
| `NODE_ENV=production`             | ✓   | ✓      | ✓        | —   |
| `LOG_LEVEL`                       | ✓   | ✓      | ✓        | —   |
| `PUBLIC_SITE_URL`                 | ✓   | ✓      | ✓        | ✓   |
| `API_PUBLIC_URL`                  | ✓   | ✓      | —        | ✓   |
| `DATABASE_URL`                    | ✓   | ✓      | ✓        | —   |
| `PG_SSL=require`                  | ✓   | ✓      | ✓        | —   |
| `REDIS_URL`                       | ✓   | ✓      | —        | —   |
| `STRIPE_SECRET_KEY`               | ✓   | —      | —        | —   |
| `STRIPE_WEBHOOK_SECRET`           | ✓   | —      | —        | —   |
| `AWS_REGION`                      | ✓   | ✓      | —        | —   |
| `AWS_ACCESS_KEY_ID`               | ✓   | ✓      | —        | —   |
| `AWS_SECRET_ACCESS_KEY`           | ✓   | ✓      | —        | —   |
| `S3_BUCKET`                       | ✓   | ✓      | —        | —   |
| `S3_CDN_BASE`                     | ✓   | ✓      | —        | —   |
| `DOWNLOAD_TOKEN_SECRET`           | ✓   | ✓      | —        | —   |
| `POSTMARK_API_TOKEN`              | ✓   | ✓      | ✓        | —   |
| `MAIL_FROM`                       | ✓   | ✓      | ✓        | —   |
| `ADMIN_JWT_SECRET`                | ✓   | —      | —        | —   |
| `SENTRY_DSN`                      | ✓   | ✓      | ✓        | ✓   |
| `ALERT_WEBHOOK_URL`               | ✓   | ✓      | ✓        | —   |
| `NEXT_PUBLIC_API_BASE_URL`        | —   | —      | —        | ✓   |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | — | —     | —        | ✓   |

The `scripts/check-env.js` script validates that a process has every var it
needs before booting. Wire it as a pre-start in your deploy YAML (see
`backend-stub/.github/workflows/deploy-api.yml.example`).

---

## 7. Postmark (transactional email)

```
1. Create a server at https://account.postmarkapp.com/servers
2. Add Sender Signature: info@celebratebanner.com
3. Verify SPF + DKIM at your DNS provider (Postmark walks you through it).
4. After verification, generate a "Server API Token" → set as
   POSTMARK_API_TOKEN.
5. Set the Return-Path domain (pm-bounces.celebratebanner.com) for bounce
   handling.
```

**Volume**: Postmark free tier is 100 emails/month. Launch plan: 10k/month
$15. Each successful order sends 1–2 emails (delivery + optional recovery).

---

## 8. Sentry (errors)

```
1. Create project at https://sentry.io/ → Node.js platform.
2. Copy the DSN → set as SENTRY_DSN on api + worker + recovery.
3. Set up "Issue Owners" so render failures auto-assign to whoever owns the
   render-engine pieces (you).
4. Performance: enable transactions sampling at 0.1 for the api process
   (10% of requests get full performance traces).
```

---

## Production defaults — copy this into your env

```bash
# API + workers
NODE_ENV=production
LOG_LEVEL=info
PG_SSL=require
PG_POOL_SIZE=10
RENDER_CONCURRENCY=2
RENDER_TIMEOUT_MS=300000
RENDER_ATTEMPTS=3
IMAGE_OPT_CONCURRENCY=4
IMAGE_OPT_DELAY_MS=8000
RECOVERY_DELAY_HOURS=4
RECOVERY_INTERVAL_MS=900000
RECOVERY_DAILY_CAP=500
DOWNLOAD_TOKEN_TTL_DAYS=7
DOWNLOAD_TOKEN_MAX_USES=100
S3_UPLOAD_TTL_SECONDS=600
S3_DOWNLOAD_TTL_SECONDS=604800
```

---

## What you DON'T need

- **No Kubernetes**. The workload is small enough that "1 box per process"
  on Fly.io or Railway is correct.
- **No Kafka**. BullMQ + Redis covers our queueing needs through ~50k
  orders/month.
- **No service mesh**. Three Node processes don't need Istio.
- **No microservices split**. The render engine is a library, not a service.
