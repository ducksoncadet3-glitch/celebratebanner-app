# DNS + SSL — exact records + verification

Apex zone: **celebratebanner.com**. The same pattern duplicates for
`staging.celebratebanner.com` if you run a staging environment.

## Records

Set TTL to **300 seconds** during cutover so you can revert quickly. Bump to
3600 once the system has been stable for a week.

| Host                          | Type    | Value                                            | Purpose                          |
| ----------------------------- | ------- | ------------------------------------------------ | -------------------------------- |
| `celebratebanner.com`         | A/ALIAS | host running `/web` (Cloudflare Pages / Fly)     | Marketing + builder              |
| `www.celebratebanner.com`     | CNAME   | `celebratebanner.com`                            | Redirect to apex (host handles it) |
| `app.celebratebanner.com`     | CNAME   | host running `/web`                              | (Optional, same as apex)         |
| `api.celebratebanner.com`     | CNAME   | host running celebratebanner-api                 | API + Stripe webhook + uploads   |
| `admin.celebratebanner.com`   | CNAME   | host running celebratebanner-admin               | Operator dashboard               |
| `cdn.celebratebanner.com`     | CNAME   | `dxxxxxxxxxxxxx.cloudfront.net`                  | Render + upload CDN              |

### Email (verify Postmark sender)

| Host                                                 | Type | Value (from Postmark)                                                    |
| ---------------------------------------------------- | ---- | ------------------------------------------------------------------------ |
| `celebratebanner.com`                                | TXT  | `v=spf1 a mx include:spf.mtasv.net ~all`                                 |
| `20240101._domainkey.celebratebanner.com`            | TXT  | (Postmark provides the DKIM value when you add the sender)               |
| `pm-bounces.celebratebanner.com`                     | CNAME| `pm.mtasv.net`  (return-path bounce handling)                            |
| `_dmarc.celebratebanner.com`                         | TXT  | `v=DMARC1; p=quarantine; rua=mailto:dmarc@celebratebanner.com; pct=100`  |

DMARC starts at `p=quarantine` — gives you visibility without blocking
delivery. Move to `p=reject` once SPF + DKIM are reliably green for ~2 weeks.

## SSL / TLS

| Host                          | Cert provider                | Notes                                |
| ----------------------------- | ---------------------------- | ------------------------------------ |
| `celebratebanner.com`         | host's ACME (Cloudflare/Fly) | Auto-renews                          |
| `api.celebratebanner.com`     | host's ACME                  | Same                                 |
| `admin.celebratebanner.com`   | host's ACME                  | Same                                 |
| `cdn.celebratebanner.com`     | **ACM in us-east-1**         | CloudFront pulls certs from us-east-1 |

CloudFront cert (must be in us-east-1 regardless of your bucket region):

```bash
aws acm request-certificate \
  --domain-name cdn.celebratebanner.com \
  --validation-method DNS \
  --region us-east-1
# Note the CertificateArn it returns; add the DNS validation CNAMEs to your zone,
# then wait ~5 min and attach to the CloudFront distribution.
```

## Verification commands

After DNS updates and at every cutover, run all of these. Anything red blocks
the next step.

### Resolution

```bash
for host in celebratebanner.com app.celebratebanner.com api.celebratebanner.com \
            admin.celebratebanner.com cdn.celebratebanner.com; do
  echo "── $host"
  dig +short "$host"
  dig +short CNAME "$host" 2>/dev/null
done
```

### Certs

```bash
for host in celebratebanner.com api.celebratebanner.com admin.celebratebanner.com cdn.celebratebanner.com; do
  echo "── $host"
  curl -fsSI "https://$host/" -o /dev/null -w '%{http_code} %{ssl_verify_result}\n'
done
# Expect: HTTP 2xx/3xx (frontend) or 401 (admin pre-login). ssl_verify_result must be 0.
```

### CloudFront ↔ S3 bridge

```bash
aws s3 cp /etc/hostname "s3://$S3_BUCKET/_dns_smoke.txt"
curl -fsS "https://cdn.celebratebanner.com/_dns_smoke.txt"     # expect: your hostname
aws s3 rm  "s3://$S3_BUCKET/_dns_smoke.txt"
```

### CORS (browser → S3 direct upload)

```bash
curl -v -X OPTIONS "https://$S3_BUCKET.s3.amazonaws.com/" \
  -H 'Origin: https://celebratebanner.com' \
  -H 'Access-Control-Request-Method: POST' 2>&1 \
  | grep -i 'access-control-allow'
# Expect: Access-Control-Allow-Origin: https://celebratebanner.com
```

### Stripe webhook reachability

```bash
# Hit our endpoint with a bogus signature — we should reject with 400, NOT 404.
curl -sX POST -H 'Stripe-Signature: bogus' -H 'content-type: application/json' \
  -d '{}' "https://api.celebratebanner.com/api/payments/webhook" -w '\n%{http_code}\n'
# Expect:
#   Webhook Error: ...
#   400
```

If you get 404 or 502, the host isn't routing `/api/payments/webhook` to the
API process. Fix routing before going live; Stripe will retry on 5xx, but a
404 is a permanent drop on their end.

### Email deliverability

```bash
# After Postmark verifies the sender, send yourself the delivery template:
curl -X POST "https://api.postmarkapp.com/email" \
  -H "X-Postmark-Server-Token: $POSTMARK_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "From": "info@celebratebanner.com",
    "To": "you@example.com",
    "Subject": "DNS smoke test",
    "TextBody": "If you see this, SPF+DKIM are green."
  }'

# Then check the spam score:
#   1. Email yourself the smoke test ↑
#   2. Open Mail → View source → look for `Authentication-Results: ...; dkim=pass; spf=pass`
#   3. Run https://www.mail-tester.com — aim for 10/10
```

## Cutover order

1. Provision the new hosts (api, admin, cdn). Keep `celebratebanner.com` apex
   still pointing at the legacy static `index.html`.
2. Verify each new host responds correctly via its `.fly.dev` / `.pages.dev`
   placeholder URL.
3. Add the new DNS records, but leave the apex unchanged.
4. Verify each new domain individually with the commands above.
5. Run the smoke test against `api.celebratebanner.com`.
6. **Last step**: flip the apex `celebratebanner.com` from legacy to `/web`.
   Expected propagation window: TTL (300s) + provider cache. Watch:

```bash
while true; do
  echo -n "$(date +%H:%M:%S) → "
  curl -sfI 'https://celebratebanner.com/' | head -1
  sleep 10
done
```

You should see the response transition from the legacy nginx/Vercel banner to
your Next.js `x-powered-by: …` headers within ~5 minutes.

## Rollback DNS

If something is wrong after the apex flip, just point `celebratebanner.com`
back at the legacy host. Same TTL applies — < 5 min back to safety.
