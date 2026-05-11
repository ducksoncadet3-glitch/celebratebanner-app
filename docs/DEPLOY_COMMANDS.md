# Deployment command cheat-sheet

Copy-paste-runnable. No narrative — every line goes in the terminal. Assumes
infra is provisioned per [INFRASTRUCTURE.md](INFRASTRUCTURE.md) and env vars
are loaded per [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) section A2.

If your terminal isn't logged into the right tools, do that first:

```bash
gh auth status                                  # GitHub CLI
aws sts get-caller-identity                     # AWS
stripe login                                    # Stripe CLI
flyctl auth whoami    || true                   # Fly (if using Fly)
```

---

## 1 · Database migration

Runs against production Postgres. Idempotent — safe to re-run on every deploy.

```bash
# Local one-off (e.g. cutover day, ahead of CI taking over):
export DATABASE_URL="postgres://migrator:…@host:5432/celebratebanner?sslmode=require"
export PG_SSL=require
cd celebratebanner-api
node db/migrate.js --status                     # show pending vs applied
node db/migrate.js                              # apply everything pending
```

```bash
# Via GitHub Actions (preferred — the migrator credentials live in CI secrets,
# not on your laptop):
gh workflow run deploy-api.yml --repo $YOUR_ORG/celebratebanner-api --ref main
```

Verify:

```bash
psql "$DATABASE_URL" -c "SELECT name, applied_at FROM schema_migrations ORDER BY name;"
```

---

## 2 · API deployment

```bash
# Trigger via GitHub Actions (the canonical path)
gh workflow run deploy-api.yml --repo $YOUR_ORG/celebratebanner-api --ref main

# Watch
gh run watch --repo $YOUR_ORG/celebratebanner-api
```

Direct deploy per host (use only when you can't go through CI):

```bash
# Fly.io
cd celebratebanner-api
flyctl deploy --remote-only --strategy bluegreen

# Render
curl -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY"

# Plain VPS via SSH
ssh deploy@$HOST 'cd /srv/celebratebanner-api && \
  git fetch && git checkout main && npm ci --omit=dev && \
  sudo systemctl reload celebratebanner-api'
```

Verify:

```bash
curl -fsS https://api.celebratebanner.com/health/ready
# Expect:  {"ok":true}
```

---

## 3 · Render-worker deployment

The worker is a **separate process** from the API. Each gets its own deploy unit.

```bash
# Fly.io (separate process group in fly.toml)
flyctl deploy --process worker --remote-only

# Render (separate "Background Worker" service)
curl -X POST "https://api.render.com/v1/services/$RENDER_WORKER_SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY"

# VPS via systemd
ssh deploy@$WORKER_HOST 'sudo systemctl restart celebratebanner-worker'
```

Verify the worker is consuming jobs:

```bash
# Should show concurrency=2 + queue depth dropping
redis-cli -u "$REDIS_URL" --tls XLEN bull:cb-renders:wait
redis-cli -u "$REDIS_URL" --tls XLEN bull:cb-renders:active
```

---

## 4 · Recovery-worker deployment

```bash
# Same pattern as render worker — separate process group.
flyctl deploy --process recovery --remote-only

# OR, if running as a periodic cron container:
fly machine run -e RUN_ONCE=1 -- node workers/abandoned-checkout.worker.js
```

Verify (audit_log entry created within ~15 minutes if there are any
pending-with-photos projects older than `RECOVERY_DELAY_HOURS`):

```bash
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) FROM audit_log
   WHERE action = 'project.recovery-sent'
     AND created_at > NOW() - interval '1 day';"
```

---

## 5 · Redis connection verification

```bash
# Basic reachability + auth
redis-cli -u "$REDIS_URL" --tls PING
# Expect:  PONG

# BullMQ queue depth
redis-cli -u "$REDIS_URL" --tls --scan --pattern 'bull:cb-renders:*' | head

# From inside the API box (curl the readiness probe, which calls Redis)
curl -fsS https://api.celebratebanner.com/health/dependencies | jq .checks.redis
```

---

## 6 · S3 verification

```bash
# Bucket exists + I can write
aws s3 ls "s3://$S3_BUCKET" | head -3
echo 'smoke' | aws s3 cp - "s3://$S3_BUCKET/_smoke/$(date +%s).txt"
aws s3 rm "s3://$S3_BUCKET/_smoke/" --recursive

# Versioning enabled
aws s3api get-bucket-versioning --bucket "$S3_BUCKET"
# Expect: { "Status": "Enabled" }

# Public access blocked
aws s3api get-public-access-block --bucket "$S3_BUCKET"
# Expect: all four flags = true

# CORS applied
aws s3api get-bucket-cors --bucket "$S3_BUCKET"

# Lifecycle applied
aws s3api get-bucket-lifecycle-configuration --bucket "$S3_BUCKET"
```

---

## 7 · CloudFront verification

```bash
# Distribution is deployed (status=Deployed, not InProgress)
aws cloudfront get-distribution --id "$CF_DISTRIBUTION_ID" \
  --query 'Distribution.Status'
# Expect: "Deployed"

# Origin Access Control wired to the S3 bucket
aws cloudfront get-distribution-config --id "$CF_DISTRIBUTION_ID" \
  --query 'DistributionConfig.Origins.Items[0].OriginAccessControlId'

# CDN serves a known object (upload one then fetch it)
aws s3 cp /etc/hostname "s3://$S3_BUCKET/_cdn_smoke.txt"
curl -fsS "https://cdn.celebratebanner.com/_cdn_smoke.txt"
aws s3 rm "s3://$S3_BUCKET/_cdn_smoke.txt"

# Cache headers are sane on a render asset (will only pass after first render)
curl -sI "https://cdn.celebratebanner.com/renders/proj_xxx/yyy/jpeg.jpeg" | grep -iE 'cache-control|x-cache'
```

---

## 8 · Stripe webhook verification

```bash
# 1. Confirm the endpoint exists in Stripe and is enabled
stripe webhook_endpoints list --limit 5

# 2. Listen to live webhook events (read-only, doesn't intercept):
stripe events list --limit 10

# 3. Trigger a synthetic event AGAINST PRODUCTION (test mode key only — never live!)
STRIPE_API_KEY=sk_test_… \
  stripe trigger checkout.session.completed \
    --override 'checkout_session:metadata.projectId=proj_smoke' \
    --override 'checkout_session:metadata.templateId=graduation' \
    --override 'checkout_session:metadata.renderType=standard' \
    --override 'checkout_session:metadata.customerEmail=smoke@example.com' \
    --override 'checkout_session:metadata.productIds=digital'

# 4. Confirm we accepted it
psql "$DATABASE_URL" -c "
  SELECT type, status, received_at FROM webhook_events
   ORDER BY received_at DESC LIMIT 5;"

# 5. Confirm the signature secret matches by simulating a malformed request:
curl -sX POST -H 'Stripe-Signature: bogus' \
  -H 'content-type: application/json' \
  -d '{}' https://api.celebratebanner.com/api/payments/webhook
# Expect: HTTP 400 with "Webhook Error: …"
```

---

## 9 · Frontend deployment

```bash
# Via GitHub Actions
gh workflow run deploy-web.yml --repo $YOUR_ORG/celebratebanner-app --ref main

# Watch
gh run watch --repo $YOUR_ORG/celebratebanner-app

# Direct (Cloudflare Pages)
cd web && npm ci && npm run build
wrangler pages deploy .next --project-name=celebratebanner-web --branch=main
```

Verify:

```bash
curl -fsS https://app.celebratebanner.com/ | grep -o '<title>[^<]*</title>'
# Expect:  <title>CelebrateBanner …</title>
```

---

## 10 · Smoke test (against the live API, Stripe TEST key)

```bash
API_BASE_URL=https://api.celebratebanner.com \
STRIPE_SECRET_KEY=sk_test_… \
SMOKE_TIMEOUT_MS=180000 \
node scripts/smoke-test.js
# Expect: ✓ all good — total <N>s
```

---

## 11 · Bootstrap the first admin user (one-time)

```bash
# From inside the API process / box that has DATABASE_URL set:
node -e "
  process.env.ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'irrelevant-for-bootstrap';
  require('./middleware/admin-auth').bootstrap('you@celebratebanner.com', 'long-strong-password')
    .then(r => { console.log(r); process.exit(0); })
    .catch(e => { console.error(e); process.exit(1); });
"
```

Verify:

```bash
psql "$DATABASE_URL" -c "SELECT email, is_admin, password_hash IS NOT NULL AS has_pw FROM users WHERE is_admin = TRUE;"
```

Then log into the admin dashboard at `https://admin.celebratebanner.com/` and
confirm `/api/admin/overview` returns counts (not a 401).

---

## 12 · Backups verification

```bash
# Manual backup right now (don't wait for cron on launch day)
DATABASE_URL=… \
BACKUP_S3_BUCKET=celebratebanner-backups \
BACKUP_RETENTION_DAYS=30 \
bash scripts/backup-postgres.sh

# Confirm it's in S3
aws s3 ls "s3://celebratebanner-backups/postgres/$(date -u +%Y/%m)/"

# Verify restore (uses a SEPARATE database — never production!)
BACKUP_S3_BUCKET=celebratebanner-backups \
VERIFY_DATABASE_URL=postgres://…/celebratebanner_verify \
bash scripts/verify-backup.sh
```

---

## Quick one-liner for the on-call hand-off

```bash
echo "--- API"            && curl -sfS https://api.celebratebanner.com/health/dependencies | jq .
echo "--- Queue"           && redis-cli -u "$REDIS_URL" --tls XLEN bull:cb-renders:wait
echo "--- Last 5 webhooks" && psql "$DATABASE_URL" -c "SELECT type, status FROM webhook_events ORDER BY received_at DESC LIMIT 5;"
echo "--- Last 5 renders"  && psql "$DATABASE_URL" -c "SELECT status, duration_ms FROM renders ORDER BY enqueued_at DESC LIMIT 5;"
```
