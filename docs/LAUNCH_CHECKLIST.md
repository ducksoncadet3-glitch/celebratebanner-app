# Launch checklist

Work this top-to-bottom on the day you flip DNS. Total time: 2–3 hours
including the smoke test. Every box must be checked AND someone's name
written next to it. No silent green-checking.

> "Production ready" is defined by the [KPI section](#kpi-definition-of-done)
> at the bottom. The checklist above isn't done until the KPI run-through
> passes against the live system.

---

## A · Pre-flight (do these BEFORE touching DNS)

### A1 · Infrastructure provisioned

- [ ] **Postgres**: connection string set in env; `db/migrate.js --status` shows all migrations applied
- [ ] **Postgres**: SSL enforced (`PG_SSL=require`); separate `app_user` role used at runtime
- [ ] **Postgres**: PITR/snapshots enabled with ≥ 7 days retention
- [ ] **Redis**: TLS-only `rediss://` URL; same region as render worker
- [ ] **S3**: bucket exists, versioning ON, public access blocked
- [ ] **S3**: CORS policy applied from `backend-stub/infra/s3-cors.json`
- [ ] **S3**: lifecycle rules applied from `backend-stub/infra/s3-lifecycle.json`
- [ ] **CloudFront**: distribution created with OAC; ACM cert in us-east-1; custom domain `cdn.celebratebanner.com`
- [ ] **Postmark**: sender `info@celebratebanner.com` verified (SPF + DKIM green)
- [ ] **Stripe**: live webhook endpoint registered; signing secret captured
- [ ] **Sentry**: project created; DSN captured

### A2 · Secrets in place (run `node scripts/check-env.js api` and `worker`)

- [ ] No `sk_test_…` in production envs
- [ ] `STRIPE_WEBHOOK_SECRET` matches the **live** endpoint, not test
- [ ] `DOWNLOAD_TOKEN_SECRET` is ≥ 32 random bytes (not the example value)
- [ ] `ADMIN_JWT_SECRET` is ≥ 32 random bytes (not the example value)
- [ ] `AWS_ACCESS_KEY_ID` belongs to the least-privilege `celebratebanner-api` IAM user, NOT the root account
- [ ] `DATABASE_URL` (runtime) uses `app_user` role with DML-only permissions
- [ ] `MIGRATOR_DATABASE_URL` (CI only) has DDL permissions, lives only in GitHub Secrets

### A3 · Deploys configured

- [ ] `.github/workflows/test.yml` — green on the commit you're shipping
- [ ] `.github/workflows/deploy-web.yml` — deploy target chosen (Cloudflare Pages / Fly / VPS) and uncommented
- [ ] `celebratebanner-api/.github/workflows/deploy-api.yml` — deploy target chosen and uncommented
- [ ] `celebratebanner-api/.github/workflows/rollback.yml` — present and points at the same target
- [ ] Health check verified locally: `curl https://api.celebratebanner.com/health/ready` returns 200

### A4 · Operational

- [ ] **Backups**: `scripts/backup-postgres.sh` is scheduled (cron / Fly scheduled machine / GitHub Action)
- [ ] **Backup verify**: `scripts/verify-backup.sh` is scheduled monthly against a non-prod DB
- [ ] **Alerts**: `ALERT_WEBHOOK_URL` points at a Slack/Discord channel that operators actually read
- [ ] **Sentry**: a test exception lands in the Sentry project (use Sentry's Test button)
- [ ] **Admin bootstrap**: at least one admin user created — `node -e "require('./middleware/admin-auth').bootstrap('you@…','pw').then(console.log)"`

### A5 · Code

- [ ] Latest commit on `main` is the one being deployed (no local-only fixes)
- [ ] CLAUDE.md pricing values match the Stripe products
- [ ] Legacy static Stripe link removed from `NEXT_PUBLIC_LEGACY_STRIPE_LINK` (or set blank) once the new flow is verified
- [ ] `web/.env.example` and `backend-stub/env.example` are up to date with everything `check-env.js` requires

---

## B · Day-of cutover

Order matters. Don't skip.

### B1 · Backend goes live first (zero customer impact — old site still routes)

1. [ ] Run migrations: in CI or via `node db/migrate.js`
2. [ ] Deploy api + worker + recovery via `deploy-api.yml`
3. [ ] Wait for `/health/ready` to return 200 from `api.celebratebanner.com`
4. [ ] Run `scripts/smoke-test.js` against the live API (Stripe TEST key)
5. [ ] Hit the admin dashboard at `admin.celebratebanner.com`, confirm `/api/admin/overview` loads
6. [ ] Open Stripe dashboard → Developers → Webhooks → confirm recent test event was `200 OK` from your endpoint

### B2 · Frontend goes live second

1. [ ] Deploy `/web` via `deploy-web.yml`
2. [ ] Confirm `https://app.celebratebanner.com/` renders
3. [ ] Walk through `/create` manually: theme → upload → design → preview shows real banner
4. [ ] Open Stripe Checkout (test mode), pay through, land on `/success`, confirm token email arrives

### B3 · DNS cutover (last, brief downtime per record)

1. [ ] Change `celebratebanner.com` → `/web` host (TTL was 300 → expect <5 min propagation)
2. [ ] Smoke-test the apex domain
3. [ ] Re-point Stripe webhook from any temp URL to `https://api.celebratebanner.com/api/payments/webhook` if it was elsewhere
4. [ ] Disable the legacy static `buy.stripe.com/...` payment link in the Stripe dashboard

---

## C · Post-launch (within first 24 hours)

- [ ] Watch the Sentry Issues feed for the first hour — anything red? Investigate immediately.
- [ ] Watch `cb_render_failures_total` rate-of-change (Grafana / Prometheus). Should be 0.
- [ ] Confirm at least one **real paid order** has completed end-to-end (not a smoke test).
- [ ] Confirm the recovery worker has run at least once: `SELECT COUNT(*) FROM audit_log WHERE action = 'project.recovery-sent' AND created_at > NOW() - interval '1 day';`
- [ ] Verify a Postgres backup landed in S3: `aws s3 ls s3://$BACKUP_S3_BUCKET/postgres/$(date -u +%Y/%m)/`
- [ ] Document who's on-call this week + how to reach them.

---

## D · Rollback drill (do once, BEFORE launch — never during an incident is the first time)

- [ ] Pick a SHA from main. Run `gh workflow run rollback.yml --field sha=<sha>`.
- [ ] Watch the workflow run: validate → deploy → verify.
- [ ] Confirm smoke test passes on the rolled-back deploy.
- [ ] Roll forward to current HEAD: re-run `deploy-api.yml` against `main`.
- [ ] Total elapsed time should be < 15 minutes. If not, fix the deploy pipeline before launch.

---

## KPI · Definition of done

The system is production-ready ONLY after all of the following are observed
**together, in production, on a real order, with no manual intervention**.

```
1. Customer opens app.celebratebanner.com/create.
2. Customer uploads at least one photo. The browser computes a sha256, POSTs
   /api/uploads/signed, gets back a presigned policy, and the file lands in S3.
   ✓ Row exists in `uploads` table.
   ✓ File visible in S3 via the CDN URL.

3. Customer picks an arrangement + frame + types text. The autosave fires.
   ✓ `projects.render_input` reflects the latest selections.
   ✓ `projects.rev` is greater than 0.

4. Customer hits a Stripe Checkout button, completes payment with a LIVE card.
   ✓ Stripe webhook fires `checkout.session.completed`.
   ✓ Webhook returns 200.
   ✓ Row in `webhook_events` with status='ok'.
   ✓ Row in `payments` with status='succeeded'.
   ✓ Row in `audit_log` with action='payment.succeeded'.
   ✓ `projects.status` = 'paid'.

5. The render worker picks up the BullMQ job.
   ✓ Row in `renders` with status='running', then 'done'.
   ✓ `renders.duration_ms` between 1000 and 30000.
   ✓ `cb_render_duration_ms_bucket` metric incremented.

6. The worker uploads the PNG / JPEG / stand-mockup to S3.
   ✓ S3 keys exist for all three.
   ✓ `renders.png_key`, `jpeg_key`, `mockup_key` populated.

7. The worker issues download tokens.
   ✓ Row in `download_tokens` for each asset.
   ✓ Token hash stored, plaintext never stored.

8. The worker sends the delivery email via Postmark.
   ✓ `audit_log` shows mailer.sent (or Postmark's "Delivered" status).
   ✓ Email lands in the customer inbox.

9. Customer clicks the download link.
   ✓ `download_tokens.used_count` increments.
   ✓ `download_tokens.last_ip` populated.
   ✓ Customer's browser receives the file from S3 via 302 redirect.

10. Admin dashboard reflects all of the above.
    ✓ `/projects/:id` shows the project in 'ready' state with payment + render + audit history.
    ✓ Audit log shows every step from payment.succeeded → delivery.sent.

11. The download token expires 7 days later.
    ✓ Attempt after 7 days returns 410 Gone.
    ✓ `download_tokens.expires_at` is honored.
```

If you can't tick every box on a real order, you're not in production yet
no matter what the README says. Run the smoke test, fix the gap, run it again.
