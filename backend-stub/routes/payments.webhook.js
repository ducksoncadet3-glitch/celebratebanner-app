/**
 * POST /api/payments/webhook
 *
 * Stripe → us. Verifies the signature, then dispatches on event type:
 *   • checkout.session.completed              → mark project paid, kick off render
 *   • checkout.session.async_payment_succeeded → same (for delayed payments)
 *   • checkout.session.async_payment_failed   → mark project failed, notify
 *   • charge.refunded                         → mark project refunded, revoke links
 *
 * The raw body parser is exported so the host app can register it ONLY for this
 * route (Stripe needs the unparsed bytes to verify the signature).
 */

const Stripe = require('stripe');
const express = require('express');
const {
  markProjectPaid,
  markProjectFailed,
  markProjectRefunded,
  triggerRender,
  generateSignedDownloads,
} = require('../services/projects');
const { sendDeliveryEmail, sendFailureEmail } = require('../services/mailer');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Use this BEFORE express.json() in the host app, only on the webhook route.
const webhookRawParser = express.raw({ type: 'application/json' });

async function webhookHandler(req, res) {
  let event;
  try {
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.warn('[webhook] signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Acknowledge fast — Stripe expects a 2xx within ~10s. Do the heavy work
  // synchronously here only if it's quick; otherwise enqueue and return 200.
  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object;
        await handleSessionSucceeded(session);
        break;
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object;
        await handleSessionFailed(session);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        await handleRefund(charge);
        break;
      }
      default:
        // Lots of events are uninteresting — acknowledge them and move on.
        break;
    }
  } catch (err) {
    console.error('[webhook] handler error', err);
    // Returning 5xx makes Stripe retry — only do that if the failure is
    // transient. For data errors, return 200 to prevent infinite retries.
    return res.status(500).send('Handler error');
  }

  return res.status(200).json({ received: true });
}

async function handleSessionSucceeded(session) {
  const projectId = session.metadata?.projectId;
  const templateId = session.metadata?.templateId;
  const renderType = session.metadata?.renderType || 'standard';
  const customerEmail = session.customer_details?.email || session.metadata?.customerEmail;
  const productIds = (session.metadata?.productIds || '').split(',').filter(Boolean);

  if (!projectId) {
    console.warn('[webhook] session.completed without projectId, ignoring', session.id);
    return;
  }

  await markProjectPaid({
    projectId,
    stripeSessionId: session.id,
    paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    amountTotalCents: session.amount_total ?? 0,
    currency: session.currency ?? 'usd',
    customerEmail,
    productIds,
    shippingAddress: session.shipping_details?.address ?? null,
  });

  // Kick off the final render (this is what unlocks HD downloads).
  const render = await triggerRender({ projectId, templateId, renderType, productIds });

  // Generate short-lived signed URLs for the email + dashboard.
  const links = await generateSignedDownloads({ projectId, renderId: render.renderId, productIds });

  await sendDeliveryEmail({ to: customerEmail, projectId, links });
}

async function handleSessionFailed(session) {
  const projectId = session.metadata?.projectId;
  const customerEmail = session.customer_details?.email || session.metadata?.customerEmail;
  if (!projectId) return;
  await markProjectFailed({ projectId, reason: 'async_payment_failed', stripeSessionId: session.id });
  if (customerEmail) await sendFailureEmail({ to: customerEmail, projectId });
}

async function handleRefund(charge) {
  const projectId = charge.metadata?.projectId
    || charge.payment_intent_data?.metadata?.projectId
    || charge.transfer_data?.destination;
  if (!projectId) return;
  await markProjectRefunded({ projectId, stripeChargeId: charge.id, amountRefundedCents: charge.amount_refunded });
}

module.exports = { webhookHandler, webhookRawParser };
