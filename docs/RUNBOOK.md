# Operations runbook

When something breaks in production, look here first.

## Stack

```
celebratebanner.com           static index.html  (legacy site, untouched)
app.celebratebanner.com       /web Next.js app
api.celebratebanner.com       celebratebanner-api (Node + Express)
cdn.celebratebanner.com       CloudFront → S3 bucket
admin.celebratebanner.com     celebratebanner-admin (Next.js)
```

Three Node processes per environment:

- **api** — HTTP server (Stripe webhook, uploads, downloads, admin API)
- **render-worker** — BullMQ consumer (HD renders + slideshow encoding)
- **recovery-worker** — abandoned-checkout cron

## Smoke test (run after every prod deploy)

```bash
# 1. Health
curl -fsS https://api.celebratebanner.com/metrics | head -3

# 2. Webhook events table is being written to
psql "$DATABASE_URL" -c "SELECT type, status, COUNT(*) FROM webhook_events
  WHERE received_at > NOW() - interval '1 hour' GROUP BY 1, 2;"

# 3. Recent renders completing
psql "$DATABASE_URL" -c "SELECT status, AVG(duration_ms)::int AS avg_ms, COUNT(*)
  FROM renders WHERE enqueued_at > NOW() - interval '1 hour' GROUP BY 1;"

# 4. Place a Stripe test-mode order. Confirm in admin dashboard:
#    pending → paid → rendering → ready
#    + email lands with working download links
```

## On-call playbook

### Symptom: customer didn't get their email

1. Find the project: admin dashboard → search by email.
2. Check the project status. If `rendering`, the worker is still processing — give it 5 min.
3. If `ready` but no email, hit **Resend delivery** in the project detail page.
   That re-issues download tokens and re-sends.
4. If `failed`, look at the latest render row's `error_message`. Hit **Re-render HD**.
5. If `paid` but no render row, the webhook didn't enqueue. Check the audit log
   for `payment.succeeded` and the BullMQ failed list. Fix the queue first, then
   re-render from admin.

### Symptom: Stripe webhook is bouncing

1. `SELECT * FROM webhook_events WHERE status = 'failed' ORDER BY received_at DESC LIMIT 20;`
2. If most failures share an `error_message`, fix the root cause (DB down, Redis down, etc.).
3. To replay a single event, ask Stripe to resend from the dashboard. The
   idempotency table allows replays — first-seen wins, replays are no-ops.

### Symptom: queue depth climbing

1. Admin → Queue page. If `active === RENDER_CONCURRENCY` and `waiting` is rising,
   the worker is keeping up but the input rate is too high.
2. Scale workers: increase `RENDER_CONCURRENCY` (each in-flight HD render peaks
   at ~600 MB; size the box accordingly) or add another worker process.
3. If `failed` is climbing, click into a failed job, read the reason, then
   **Retry**. If 100% failures, the worker has a bug — revert the last deploy.

### Symptom: renders are slow

```bash
# p50/p95 render duration in the last hour
curl -s https://api.celebratebanner.com/metrics | grep cb_render_duration_ms_bucket
```

p95 > 20s for sustained periods usually means worker box memory pressure (swap)
or the engine is processing too many photos per render. Scale up worker RAM.

### Symptom: signed downloads returning 404

The download_tokens row was deleted (refund revokes them) or the S3 object expired.

```bash
psql "$DATABASE_URL" -c "SELECT asset_type, expires_at, used_count
  FROM download_tokens WHERE project_id = 'proj_xxx';"
```

If the token is expired, issue a new one via admin **Resend delivery**.

## Backups

### Postgres

```bash
# Schedule: daily full pg_dump → S3, retained 30 days.
# Cron example (adjust for your host):

0 3 * * *  pg_dump --no-owner --no-acl --format=custom "$DATABASE_URL" \
  | aws s3 cp - "s3://celebratebanner-backups/postgres/$(date +%F).dump"
```

Hosted Postgres (Neon, RDS) usually includes PITR — confirm yours is enabled
**before** going live and that retention >= 7 days.

### S3

Enable S3 versioning on the uploads + renders bucket:

```bash
aws s3api put-bucket-versioning \
  --bucket celebratebanner-uploads-prod \
  --versioning-configuration Status=Enabled
```

Plus a lifecycle policy that transitions to Glacier Deep Archive after 90 days
and deletes after 1 year (originals only — keep renders forever since they
cost pennies).

### Redis

BullMQ state is recoverable (the source of truth is Postgres). No backup
needed; on Redis loss the API will queue any fresh renders fine, and
admin can re-render any project whose render row is missing.

## Rollback strategy

### Frontend (/web)

```bash
# 1. Find the last good commit
gh run list --workflow=deploy-web.yml --limit=10

# 2. Trigger a manual deploy of that commit
gh workflow run deploy-web.yml --ref <sha>
```

Cloudflare Pages / Vercel also let you promote a previous build via their UI;
either way works.

### Backend (celebratebanner-api)

```bash
# In the celebratebanner-api repo:
git revert <bad-sha> --no-edit
git push origin main
# CI/CD picks it up. Wait for rolling restart.

# If a DB migration is the culprit, write a forward-fix migration
# (NEVER edit an applied one — the runner refuses it by checksum).
```

### Render worker

Worker is a separate process. After reverting the api repo, ensure your worker
deploys pull the same commit so api + worker stay in lockstep. Mismatched
versions usually surface as queue jobs failing with `Unsupported render-input version`.

### Stripe webhook

If the webhook handler is broken and accepting events, Stripe will retry. To
stop the retry storm temporarily:

1. Stripe dashboard → Developers → Webhooks → disable the endpoint.
2. Fix + deploy the api.
3. Re-enable; Stripe will redeliver missed events. Idempotency table makes
   replays safe.

## Common queries

```sql
-- Today's revenue
SELECT SUM(amount_total_cents)/100.0 AS dollars
  FROM payments WHERE status = 'succeeded' AND created_at::date = CURRENT_DATE;

-- Projects stuck in 'paid' without a render row (worker outage signal)
SELECT id, paid_at FROM projects p
 WHERE p.status = 'paid'
   AND NOT EXISTS (SELECT 1 FROM renders r WHERE r.project_id = p.id)
 ORDER BY paid_at DESC;

-- Audit trail for a single project
SELECT created_at, actor_kind, action, metadata
  FROM audit_log
 WHERE subject_kind = 'project' AND subject_id = 'proj_xxx'
 ORDER BY created_at DESC;
```

## Secrets rotation

- **STRIPE_SECRET_KEY** — rotate from Stripe dashboard; redeploy api with new env.
- **STRIPE_WEBHOOK_SECRET** — register a NEW endpoint, deploy api, then disable old endpoint.
- **DOWNLOAD_TOKEN_SECRET** — rotating invalidates EVERY outstanding download link. Send the affected customers a fresh delivery email via admin **Resend delivery** in batch.
- **AWS keys** — rotate via IAM; redeploy api + worker.
- **DATABASE_URL** password — rotate in DB, update env, redeploy.

## Incident comms

- Status page (set one up — Better Uptime, Statuspage, or a static page on a separate domain). Don't host it on `celebratebanner.com` since that's part of the same stack.
- Customer-facing email template lives in `backend-stub/email/templates/`. For an incident: reply on the original delivery email rather than a new thread — keeps the customer's inbox tidy.
