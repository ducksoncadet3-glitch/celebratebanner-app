# GO / NO-GO gate

The final yes/no before pointing real customer traffic at the new stack.
Don't proceed past this document until every signal is green.

Sign your name and the timestamp next to each line. If anything is yellow,
that's NO-GO until it turns green. Yellow ≠ acceptable.

---

## A · Health (all GREEN required)

| Signal | How | Verdict |
| --- | --- | --- |
| `/health/live` returns 200 from API | `curl -fsS https://api.celebratebanner.com/health/live` | ☐ GO ☐ NO-GO |
| `/health/ready` returns 200 from API | `curl -fsS https://api.celebratebanner.com/health/ready` | ☐ GO ☐ NO-GO |
| `/health/dependencies` shows `ok: true` for pg, redis, queue, s3 | `curl -fsS … /health/dependencies \| jq .checks` | ☐ GO ☐ NO-GO |
| Worker process is consuming the queue | `redis-cli XLEN bull:cb-renders:active` shows >0 during render | ☐ GO ☐ NO-GO |
| Frontend resolves at apex + app subdomain | `curl -fsS https://celebratebanner.com/ \| head` | ☐ GO ☐ NO-GO |

## B · Smoke test (REQUIRED)

| Signal | How | Verdict |
| --- | --- | --- |
| `scripts/smoke-test.js` exits 0 | run against `https://api.celebratebanner.com` with Stripe TEST key | ☐ GO ☐ NO-GO |
| Smoke test completes in < 90 seconds | the script prints `total <N>s` at the end | ☐ GO ☐ NO-GO |

## C · Live order (REQUIRED — see scripts/live-order-checklist.md)

| Signal | How | Verdict |
| --- | --- | --- |
| Real Stripe live charge succeeds | dashboard shows the charge in live mode | ☐ GO ☐ NO-GO |
| Webhook `checkout.session.completed` returned 200 | Stripe dashboard → Webhooks → recent | ☐ GO ☐ NO-GO |
| `projects.status` flipped to `paid` then `ready` within 30s | DB query | ☐ GO ☐ NO-GO |
| Render duration was < 30 s | `renders.duration_ms` | ☐ GO ☐ NO-GO |
| All three S3 outputs present (png + jpeg + mockup) | DB row populated | ☐ GO ☐ NO-GO |
| Download token email landed in customer inbox | check inbox | ☐ GO ☐ NO-GO |
| Email passes DKIM + SPF | "View source" → Authentication-Results | ☐ GO ☐ NO-GO |
| Download link 302s and delivers the file | click the email button | ☐ GO ☐ NO-GO |
| `download_tokens.used_count` incremented to 1 | DB query | ☐ GO ☐ NO-GO |

## D · Admin dashboard (REQUIRED)

| Signal | How | Verdict |
| --- | --- | --- |
| `https://admin.celebratebanner.com/` loads (after login) | browser | ☐ GO ☐ NO-GO |
| Project from C appears with status `ready` | admin → Projects | ☐ GO ☐ NO-GO |
| Audit log shows: payment.succeeded + render rows + delivery.sent | admin → project detail → Audit | ☐ GO ☐ NO-GO |
| **Resend delivery** triggers a second email within 30 s | click button, watch inbox | ☐ GO ☐ NO-GO |
| **Refund** flips payment to `refunded` and revokes tokens | click, then verify the original download link 404s | ☐ GO ☐ NO-GO |

## E · Alerts (REQUIRED)

| Signal | How | Verdict |
| --- | --- | --- |
| Sentry receives test events | https://sentry.io → click "Issue" tab — should see at least one test issue | ☐ GO ☐ NO-GO |
| Slack/Discord webhook posts when `captureWarning` fires | force a bad-signature webhook (see DNS_SSL.md verification) and check the channel | ☐ GO ☐ NO-GO |
| Alert dedupe works | trigger the same warning twice in quick succession — only one message posts | ☐ GO ☐ NO-GO |

## F · Rollback (REQUIRED — drill BEFORE launch, never during)

| Signal | How | Verdict |
| --- | --- | --- |
| `rollback.yml` workflow runs successfully against a previous SHA | trigger via `gh workflow run rollback.yml --field sha=<prev>` | ☐ GO ☐ NO-GO |
| Rolled-back deploy still passes smoke test | run `scripts/smoke-test.js` against it | ☐ GO ☐ NO-GO |
| Roll-forward to current HEAD works | re-trigger `deploy-api.yml` | ☐ GO ☐ NO-GO |
| Total round-trip (back + forward) < 15 minutes | clock it | ☐ GO ☐ NO-GO |

## G · Backups (REQUIRED)

| Signal | How | Verdict |
| --- | --- | --- |
| At least one pg_dump exists in the backups bucket | `aws s3 ls s3://celebratebanner-backups/postgres/$(date -u +%Y/%m)/` | ☐ GO ☐ NO-GO |
| Restore drill passes | `bash scripts/verify-backup.sh` exits 0 | ☐ GO ☐ NO-GO |
| Postgres PITR is enabled with ≥7 days retention | provider dashboard | ☐ GO ☐ NO-GO |
| S3 versioning is enabled | `aws s3api get-bucket-versioning` returns `Enabled` | ☐ GO ☐ NO-GO |

---

## Decision

- **GO** is only valid when EVERY row above is checked GO. There is no partial credit.
- If any row is NO-GO, the system is **NOT** in production. Fix it, re-run only the affected sections, and re-evaluate.

| Field | Value |
| --- | --- |
| Date / time of decision (UTC) | |
| Operator on point | |
| Operator's signature | |
| Total open NO-GOs at decision time | (must be 0) |
| Tag of commit being declared GA | `git tag …` |

---

## After GO

1. Tag and push the release: `git tag -a v1.0.0-launch -m "Production launch" && git push --tags`.
2. Capture this completed checklist (with your name + timestamps) as a PDF
   under `docs/launches/v1.0.0-launch.pdf` (or your equivalent record-keeping).
3. Watch Sentry + Stripe Dashboard + admin queue page for the first 24 hours
   (see [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) section C).
4. Schedule the next [verify-backup.sh](../scripts/verify-backup.sh) run
   for ~30 days out.

If any one of the GO conditions reverts to NO-GO during the first 24 hours,
trigger the rollback workflow (`gh workflow run rollback.yml`) rather than
firefighting in place. The cost of a 5-minute rollback is much smaller than
the cost of debugging at 3am with traffic flowing.
