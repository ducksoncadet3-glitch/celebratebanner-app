# Backend stub — Stripe Checkout Sessions for celebratebanner-api

These files are **drop-in code for the `celebratebanner-api` repository** (a
different repo). Copy them in, wire them to your app, and you have full Stripe
Checkout Sessions + webhook delivery without touching the frontend.

## Layout

```
backend-stub/
├── env.example                       # Server env vars (Stripe secret, webhook secret, etc.)
├── lib/pricing.js                    # SAME constants the frontend uses, authoritative on server
├── routes/payments.checkout.js       # POST /api/payments/checkout  → Stripe Checkout Session
├── routes/payments.webhook.js        # POST /api/payments/webhook   → Stripe → us
├── services/projects.js              # update project status, generate signed download URLs
└── services/mailer.js                # send delivery email
```

The route files are written for **Express** because that's the most common Node
backend shape, but the logic is framework-agnostic — you can lift the body of
each handler into Fastify, Hono, Next.js Route Handlers, etc.

## Install

```bash
npm install stripe@^17
```

## Register the routes (Express example)

```js
// celebratebanner-api/src/app.js
import express from 'express';
import { checkoutHandler } from './routes/payments.checkout.js';
import { webhookHandler, webhookRawParser } from './routes/payments.webhook.js';

const app = express();

// Stripe needs the RAW request body to verify webhook signatures, so register
// this route BEFORE express.json().
app.post('/api/payments/webhook', webhookRawParser, webhookHandler);

app.use(express.json({ limit: '1mb' }));
app.post('/api/payments/checkout', checkoutHandler);
```

## Stripe dashboard setup

1. **Webhook endpoint**: in the Stripe dashboard add `https://api.celebratebanner.com/api/payments/webhook` and subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `charge.refunded`
2. Copy the **Signing secret** (whsec_…) into `STRIPE_WEBHOOK_SECRET`.
3. Existing static payment link (`buy.stripe.com/7sY8wHe…`) keeps working — the
   frontend uses it as a fallback only when the API returns 5xx. Decommission
   it once these routes are live in prod.

## Security notes

- The Stripe secret key (`sk_live_…`) lives only in server env. **Never** put it
  in any `NEXT_PUBLIC_*` variable.
- The frontend sends product IDs, never amounts. The server re-prices from
  `lib/pricing.js`, so a tampered request can't change the charge.
- Webhook signature is verified with `stripe.webhooks.constructEvent`. If it
  fails we return 400 and Stripe retries.
- The cart-recovery, coupon, affiliate, and subscription hooks are stubbed in
  `payments.checkout.js` for future scaling. They're inert until you fill them in.
