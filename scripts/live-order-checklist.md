# Live-order validation checklist

The smoke test (`scripts/smoke-test.js`) validates the path in test mode. This
checklist validates the **same path on a real live-mode order** before the
system is considered production-ready. Tick every box with the customer email,
project id, and timestamp written next to it.

The order **must** be placed against a real Stripe live key, paid with a real
card. No bypassing the payment step.

> Total time: ~10 minutes of work spread across ~5 minutes of waiting for the
> renderer.

---

## Setup (one minute)

Pick the test customer email and project id you'll trace through every step.
Make them grep-able so you can pull this row out of every table easily.

```bash
export TEST_EMAIL="launch+$(date +%s)@yourdomain.com"
echo "$TEST_EMAIL"
```

Open the admin dashboard in another tab — you'll watch the project move
through statuses here as you go. URL:

```
https://admin.celebratebanner.com/projects?q=$TEST_EMAIL
```

---

## 1 · Upload verifies

In the browser: open https://celebratebanner.com/create, upload one real
photo (your phone has one), pick a theme.

- [ ] Photo thumbnail appears in the tray
- [ ] DB row exists

```bash
psql "$DATABASE_URL" -c "
  SELECT u.s3_key, u.bytes, u.width, u.height, u.created_at
    FROM uploads u
    JOIN projects p ON p.id = u.project_id
   WHERE p.customer_email = '$TEST_EMAIL'
   ORDER BY u.created_at DESC LIMIT 5;"
```

- [ ] S3 object is reachable via CDN

```bash
# Grab one URL from the query above, then:
curl -sIL 'https://cdn.celebratebanner.com/uploads/proj_xxx/.../...jpg' | head -3
# Expect: HTTP/2 200 + content-type: image/...
```

---

## 2 · Autosave verifies

Type a name in the headline field. Wait 6 seconds.

- [ ] `projects.rev` is greater than 0

```bash
psql "$DATABASE_URL" -c "
  SELECT id, status, rev, jsonb_pretty(render_input) AS payload
    FROM projects WHERE customer_email = '$TEST_EMAIL'
    ORDER BY created_at DESC LIMIT 1;"
```

- [ ] `render_input.version` is `1`, `render_input.bannerText` reflects what you typed

---

## 3 · Live Stripe payment

Click the digital download CTA on the Design step → land in Stripe Checkout
→ pay with a **real card** (charge will appear on your statement; refund
yourself afterward via the admin dashboard).

- [ ] Stripe shows the charge in the dashboard (live mode, not test)
- [ ] Stripe webhook event `checkout.session.completed` shows 2xx delivery

Open Stripe Dashboard → Developers → Webhooks → click the prod endpoint →
Recent Events. The most recent event should be 200 ms green checkmark.

---

## 4 · Webhook accepted

- [ ] `webhook_events` row exists, `status='ok'`

```bash
psql "$DATABASE_URL" -c "
  SELECT stripe_event_id, type, status, error_message, received_at
    FROM webhook_events
   ORDER BY received_at DESC LIMIT 5;"
```

- [ ] `payments` row exists, `status='succeeded'`, amount matches what you paid

```bash
psql "$DATABASE_URL" -c "
  SELECT amount_total_cents, product_ids, status, created_at
    FROM payments WHERE customer_email = '$TEST_EMAIL'
   ORDER BY created_at DESC LIMIT 1;"
```

- [ ] `audit_log` shows `payment.succeeded`

```bash
psql "$DATABASE_URL" -c "
  SELECT action, actor_kind, metadata, created_at
    FROM audit_log
   WHERE subject_id IN (SELECT id FROM projects WHERE customer_email = '$TEST_EMAIL')
   ORDER BY created_at DESC;"
```

- [ ] `projects.status` flips to `paid` within 5 seconds

---

## 5 · Render completes

Within ~10 seconds the worker should pick up the BullMQ job.

- [ ] `renders.status` moves `queued` → `running` → `done`

```bash
# Run this in a loop, watch it transition:
watch -n 2 "psql '$DATABASE_URL' -c \"
  SELECT id, status, progress, duration_ms, error_message
    FROM renders
   WHERE project_id IN (SELECT id FROM projects WHERE customer_email = '$TEST_EMAIL')
   ORDER BY enqueued_at DESC LIMIT 1;\""
```

- [ ] `renders.duration_ms` lands between 1000 and 30000 (2–4s is healthy)
- [ ] `renders.png_key`, `renders.jpeg_key`, `renders.mockup_key` are populated

---

## 6 · S3 assets present

- [ ] All three assets exist at their declared keys

```bash
# Pull the keys from the renders row above, then:
for KEY in $PNG_KEY $JPEG_KEY $MOCKUP_KEY; do
  aws s3 ls "s3://$S3_BUCKET/$KEY" && echo "  ✓ $KEY"
done
```

- [ ] CloudFront serves them (signed URL is what the customer uses, but the
      raw object should at least be reachable from us with our IAM creds)

```bash
aws s3 cp "s3://$S3_BUCKET/$JPEG_KEY" /tmp/order_test.jpeg
file /tmp/order_test.jpeg     # Expect: JPEG image data, …
rm /tmp/order_test.jpeg
```

---

## 7 · Signed download URLs work

- [ ] `download_tokens` rows exist for the order

```bash
psql "$DATABASE_URL" -c "
  SELECT asset_type, used_count, expires_at
    FROM download_tokens
   WHERE project_id IN (SELECT id FROM projects WHERE customer_email = '$TEST_EMAIL')
   ORDER BY created_at DESC;"
```

- [ ] Email arrives. (Check your inbox.)
- [ ] Click the download button in the email.
- [ ] Browser receives the JPEG (302 redirect to a short-lived S3 signed URL,
      then the file).
- [ ] `download_tokens.used_count` increments to 1; `last_ip` populated.

---

## 8 · Email delivery confirmed

- [ ] Postmark dashboard shows the message as "Delivered" (not Bounce/Spam)
- [ ] Authentication-Results in the email source shows `dkim=pass; spf=pass`
- [ ] DMARC `aligned=yes` (Gmail surfaces this in headers)

---

## 9 · Admin dashboard reflects

Open `https://admin.celebratebanner.com/projects/{project_id}`.

- [ ] Project status badge shows **ready**
- [ ] Render history shows one row with **done** status + duration
- [ ] Payments tab shows one row matching what Stripe charged
- [ ] Audit log shows the full lifecycle:
      `payment.succeeded` → render rows → `delivery.sent` (from mailer if logged)
- [ ] **Resend delivery** button works (test by clicking — confirm a second email arrives within 30s)
- [ ] **Re-render** button works (queues a fresh BullMQ job, new row in `renders`)

---

## 10 · Token expiration logic verified

This last one can't be tested in 5 minutes — it's a 7-day check. Do it in two stages:

### 10a · Verify immediate revocation

In the admin dashboard, simulate a refund via the **Refund** button (against
the test order you just placed). Then:

- [ ] `payments.status` flips to `refunded`
- [ ] `download_tokens` for this project are DELETED
- [ ] Clicking the original download link returns 404

```bash
curl -sI 'https://api.celebratebanner.com/api/downloads/proj_xxx/jpeg/TOKEN' \
  | head -1
# Expect: 404 (token revoked) or 410 (expired)
```

### 10b · Verify TTL expiration (day 8)

Set a calendar reminder for 8 days from today. On that day:

- [ ] The link from this checklist returns 410 Gone (not 200 or 302)

If it returns 200, `DOWNLOAD_TOKEN_TTL_DAYS` is wrong or the row's `expires_at`
was set incorrectly. Fix before claiming production.

---

## After this passes

- [ ] Capture the test project id + timestamps in your launch runbook
- [ ] Refund yourself for the live charge via Stripe Dashboard if the
      admin refund didn't already
- [ ] Tag the release: `git tag v1.0.0-launch && git push --tags`
- [ ] Move to [docs/GO_NO_GO.md](../docs/GO_NO_GO.md) for the final gate
