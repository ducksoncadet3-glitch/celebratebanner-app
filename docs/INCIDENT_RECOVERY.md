# Incident recovery procedures

Concrete steps for the failure modes most likely to bite. Each section opens
with the SYMPTOM (what you'll see), then the IMMEDIATE action (stop the bleed),
then the ROOT CAUSE investigation, then the RECOVERY (make customers whole).

This complements [RUNBOOK.md](RUNBOOK.md) — RUNBOOK covers normal on-call
playbooks; this doc covers actual incidents.

> **Rule of thumb**: when in doubt, take the safer action. A 5-minute delay to
> verify is cheaper than a refund storm. Refunds are recoverable; deleted
> data isn't.

---

## A · Failed renders

### Symptom

- Sentry issue: `render.failed-final`
- Admin queue page shows non-zero `failed` count
- Customer reports "I paid but no email"

### Immediate

1. Open admin Queue page → look at the failed job's reason.
2. If the failure is the **same exception across multiple projects**, you have
   a bug: pause the queue to stop the bleed.

```bash
# Pause the queue (BullMQ supports this natively)
node -e "require('./services/queue').queue.pause().then(()=>console.log('paused'))"
```

3. If failures are **scattered** (different errors per project), don't pause —
   it's probably bad input data per project. Continue.

### Root cause

```bash
# Most common reasons + the queries that prove them:

# (a) Image decode failure (one customer's photo is corrupt)
psql "$DATABASE_URL" -c "
  SELECT r.id, r.error_message, p.id, p.customer_email
    FROM renders r JOIN projects p ON p.id = r.project_id
   WHERE r.status = 'failed'
   ORDER BY r.finished_at DESC LIMIT 10;"
# → if message contains 'decode' or 'libpng', a photo is corrupt

# (b) Out-of-memory on the worker (50-photo banner on a 1GB box)
# Check Sentry for OOMKilled / heap_size exceeded

# (c) S3 access lost (IAM rotation gone wrong)
curl -fsS https://api.celebratebanner.com/health/dependencies | jq .checks.s3
```

### Recovery

For each affected project:

```bash
# Re-enqueue via admin dashboard (preferred — leaves an audit row)
# OR via SQL + curl:
PROJECT=proj_xxx
curl -X POST "https://api.celebratebanner.com/api/admin/projects/$PROJECT/rerender" \
     -H "Authorization: Bearer $ADMIN_JWT" \
     -H "x-csrf-token: $CSRF"
```

If a customer's photo is genuinely unrenderable: refund them via admin
**Refund** button. The webhook handler will revoke tokens and write the audit row.

### Resume

```bash
# Unpause the queue after the underlying bug is fixed.
node -e "require('./services/queue').queue.resume().then(()=>console.log('resumed'))"
```

---

## B · Stripe webhook broken (we're returning 5xx)

### Symptom

- Stripe Dashboard → Developers → Webhooks shows recent deliveries as 5xx
- `webhook_events.status = 'failed'` for recent rows
- Customers paying but `projects.status` not flipping to `paid`

### Immediate

**Stripe retries automatically for up to 3 days** — there's no urgency to
restore manually. But customers expect their files within an hour, not 72.

1. Read the most recent failed event's error message:

```bash
psql "$DATABASE_URL" -c "
  SELECT stripe_event_id, type, error_message, attempts
    FROM webhook_events
   WHERE status = 'failed'
   ORDER BY received_at DESC LIMIT 10;"
```

2. Common cause: a downstream service (DB, queue) is down. Check:

```bash
curl -fsS https://api.celebratebanner.com/health/dependencies | jq .
```

### Replay missed events

Once the handler is fixed and deployed:

1. Stripe Dashboard → Webhooks → click the failed delivery → **"Resend"**.
   OR, batch:
2. Use the Stripe CLI to list events Stripe still has buffered for retry:

```bash
stripe events list --type checkout.session.completed --limit 100 --created.gte=$(date -u -d '1 day ago' +%s)
```

3. For each event id, ask Stripe to redeliver:

```bash
stripe events resend evt_xxx
```

The idempotency table makes replays safe — first-seen-wins.

### If Stripe gave up retrying (>3 days)

Pull the affected sessions directly:

```bash
# Find paid sessions that have no project row in 'paid' status
stripe checkout sessions list --status complete --limit 100 \
  | jq -r '.data[] | "\(.id)\t\(.metadata.projectId)"' \
  | while read sid pid; do
      [ -z "$pid" ] && continue
      status=$(psql "$DATABASE_URL" -tAc "SELECT status FROM projects WHERE id = '$pid'")
      [ "$status" != "paid" ] && echo "STUCK $sid $pid $status"
    done
```

For each stuck session, manually trigger via Stripe:

```bash
stripe webhook_endpoints test --event=checkout.session.completed --session-id=cs_xxx
```

---

## C · Redis downtime

### Symptom

- `/health/ready` returns 503 with `failed: ["redis"]`
- Render worker logs `ECONNREFUSED` for `rediss://...`
- Rate-limit middleware fails open (it's designed to — better to let traffic
  through than 503 everyone)

### Immediate

The site keeps SERVING (rate limiter falls back, autosaves still work) but
the queue is offline:

- **Webhook handler still enqueues** — BullMQ buffers internally and retries
  the Redis connection.
- **No HD renders run until Redis is back.**
- **No new alerts fire** (dedupe falls back to in-process — a Redis-replay
  attack on alerts is impossible during this window).

```bash
# Check what's broken:
curl -fsS https://api.celebratebanner.com/health/dependencies | jq .checks.redis
redis-cli -u "$REDIS_URL" --tls PING 2>&1
```

### Recovery

If Redis is gone for < 1 hour:
- BullMQ reconnects automatically; jobs that were enqueued during the outage
  process once Redis is back.

If Redis is gone for > 1 hour or the data is lost (Upstash node replaced):
- BullMQ state is recoverable from Postgres: every payment that fired a
  webhook has a row in `webhook_events`. Replay events Stripe still has
  (see section B) to re-enqueue.

```bash
# After Redis is restored, re-enqueue any 'paid' project that has no
# subsequent render row (means the original enqueue was lost):
psql "$DATABASE_URL" -tAc "
  SELECT id FROM projects p
   WHERE p.status = 'paid'
     AND NOT EXISTS (SELECT 1 FROM renders r WHERE r.project_id = p.id)" \
| while read pid; do
    curl -sX POST "https://api.celebratebanner.com/api/admin/projects/$pid/rerender" \
         -H "Authorization: Bearer $ADMIN_JWT" \
         -H "x-csrf-token: $CSRF"
  done
```

---

## D · S3 failures

### Symptom

- Uploads fail with 403 from the browser → `[uploads] policy create failed`
  in API logs
- Render worker logs `AccessDenied` when calling `s3.putObject`
- Download links 404

### Immediate

Most likely cause: IAM keys rotated, lifecycle rule misconfigured, or bucket
policy edited by hand. Verify:

```bash
aws s3 ls "s3://$S3_BUCKET" --max-items 1
# Expect: an object list. If "AccessDenied" → keys are bad.

aws sts get-caller-identity
# Confirms WHICH user/role you're authenticated as.
```

### Recovery

If keys are revoked: generate new ones for the `celebratebanner-api` IAM
user, update env, redeploy api + worker.

If bucket policy was clobbered:

```bash
# Re-apply CORS + lifecycle from canonical files:
aws s3api put-bucket-cors --bucket "$S3_BUCKET" \
  --cors-configuration file://backend-stub/infra/s3-cors.json
aws s3api put-bucket-lifecycle-configuration --bucket "$S3_BUCKET" \
  --lifecycle-configuration file://backend-stub/infra/s3-lifecycle.json
```

If renders that were uploaded got deleted by an over-aggressive lifecycle rule:
they're recoverable via S3 versioning if it was enabled. List versions:

```bash
aws s3api list-object-versions --bucket "$S3_BUCKET" --prefix "renders/proj_xxx/" \
  | jq '.Versions + .DeleteMarkers'

# Restore the most recent version by removing the DeleteMarker:
aws s3api delete-object --bucket "$S3_BUCKET" \
  --key "renders/proj_xxx/.../jpeg.jpeg" \
  --version-id "DELETE_MARKER_VERSION_ID"
```

---

## E · Failed migrations

### Symptom

- `node db/migrate.js` exits non-zero
- Error mentions a specific SQL statement
- New deploys can't start (because `deploy-api.yml` requires migrations to
  pass first)

### Immediate

**Do NOT edit the failed migration file.** The runner's checksum guard
refuses modified files, and editing in place is what causes "works on my
machine, broken in prod" rituals.

### Recovery

```bash
# 1. Read the migrator log line — it identifies the file + the SQL error.

# 2. Connect to the DB and check what state it's in:
psql "$DATABASE_URL" -c "SELECT * FROM schema_migrations ORDER BY name DESC LIMIT 5;"
# If the failed migration is NOT in this table, the transaction rolled back
# cleanly — nothing to undo, just fix forward.

# 3. Create a forward-fix migration:
cd celebratebanner-api
node db/migrate.js --create fix_failed_thing
# This creates db/migrations/NNNN_fix_failed_thing.sql. Write the corrective
# SQL there — it'll apply on the next deploy.

# 4. If the migration ALREADY partially applied (rare — only happens if you
# wrote non-transaction-safe DDL like CREATE INDEX CONCURRENTLY):
#    a) Mark it as applied so the runner doesn't try again:
psql "$DATABASE_URL" -c "
  INSERT INTO schema_migrations (name, checksum)
  VALUES ('NNNN_failed.sql', 'corrupt-applied-manually');"
#    b) Then create the forward-fix migration as above.
```

### Never

- Never DELETE a row from `schema_migrations`
- Never EDIT an applied migration file
- Never roll a migration back by hand-running `DROP TABLE` — write a forward-fix

---

## F · Partial delivery failures

A class of issue where the order completed but ONE artifact is missing or
broken (e.g. JPEG uploaded but PNG didn't, or download link works but email
never arrived).

### Detection

```bash
# Projects that are 'ready' but missing one of the render outputs:
psql "$DATABASE_URL" -c "
  SELECT p.id, p.customer_email, r.png_key, r.jpeg_key, r.mockup_key
    FROM projects p
    JOIN LATERAL (
      SELECT * FROM renders WHERE project_id = p.id AND status = 'done'
       ORDER BY finished_at DESC LIMIT 1
    ) r ON true
   WHERE p.status = 'ready'
     AND (r.png_key IS NULL OR r.jpeg_key IS NULL OR r.mockup_key IS NULL);"
```

### Recovery

Re-render via the admin dashboard:
- Re-render writes a fresh row in `renders` and uploads all three artifacts.
- New tokens are issued; old (working) links remain valid until expiry.

If only the email failed:
- Click **Resend delivery** in admin. This re-issues tokens and re-sends the
  email without re-rendering.

---

## On-call comms

Every incident in this doc should produce, in order:

1. **Public**: status page update within 5 min if customers are visibly affected
2. **Internal**: post in #ops Slack with `INC-YYYYMMDD-N` tag
3. **Post-mortem** within 48h if the impact lasted > 30 min or affected
   > 5 orders. Template:

```
INC-YYYYMMDD-N · One-line summary
========================================
Impact:       Who was affected, what they experienced, for how long
Trigger:      The immediate cause (deploy, vendor outage, …)
Root cause:   The underlying issue
Resolution:   How we fixed it
Action items:
  - [ ] Code fix / test
  - [ ] Monitoring / alerting gap
  - [ ] Runbook update
```
