/**
 * POST /api/payments/webhook  (PRODUCTION)
 *
 * Stripe → us. Verifies the signature, then dispatches on event type and writes
 * to Postgres + enqueues HD render jobs through BullMQ.
 *
 *   • checkout.session.completed              → markPaid → enqueue render
 *   • checkout.session.async_payment_succeeded → same
 *   • checkout.session.async_payment_failed   → markFailed → notify
 *   • charge.refunded                         → markRefunded → revoke tokens
 *
 * The raw body parser is exported so the host app can register it ONLY for
 * this route (Stripe needs unparsed bytes to verify the signature).
 */

const crypto = require('node:crypto');
const Stripe = require('stripe');
const express = require('express');
const { markPaid, markFailed, markRefunded, getById } = require('../db/projects');
const { claimEvent, markEventOk, markEventFailed } = require('../db/webhook-events');
const { revokeProjectTokens } = require('../services/tokens');
const { enqueueRender } = require('../services/queue');
const { sendFailureEmail } = require('../services/mailer');
const { logger } = require('../services/logger');
const { metrics } = require('../services/metrics');
const { record: auditRecord } = require('../services/audit');
const { captureWarning, captureError } = require('../services/alerts');
const { deserializeRenderInput } = require('../utils/render-input');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const webhookRawParser = express.raw({ type: 'application/json' });

async function webhookHandler(req, res) {
  let event;
  try {
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET);
  } catch (err) {
    metrics.incWebhookBad();
    logger.warn({ err: err.message }, 'webhook.bad-signature');
    // A bad signature with a sustained pattern means either the secret was
    // rotated without re-deploying, or someone is probing the endpoint.
    // Either way it's worth a page — but heavily deduped (~5/min).
    void captureWarning('Stripe webhook signature verification failed', {
      fingerprintKey: 'webhook.bad-signature',
      error: err.message,
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Replay protection: Stripe retries deliveries for up to 3 days. Insert
  // the event into webhook_events keyed by stripe_event_id. If we've seen
  // it before, return 200 without running any side effects.
  const claim = await claimEvent(event);
  if (!claim.firstSeen) {
    metrics.incWebhookOk();
    logger.info({ eventId: event.id, type: event.type, prior: claim.status }, 'webhook.replay');
    return res.status(200).json({ received: true, deduped: true });
  }

  // Acknowledge fast — Stripe needs 2xx within ~10s. The slow work happens
  // in the BullMQ worker, not here.
  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await handleSessionSucceeded(event);
        break;
      case 'checkout.session.async_payment_failed':
        await handleSessionFailed(event);
        break;
      case 'charge.refunded':
        await handleRefund(event);
        break;
      default:
        break; // ignore uninteresting events
    }
    await markEventOk(event.id);
    metrics.incWebhookOk();
    return res.status(200).json({ received: true });
  } catch (err) {
    await markEventFailed(event.id, err.message);
    logger.error({ err: err.message, eventType: event.type, eventId: event.id }, 'webhook.handler-failed');
    // Handler failures cause Stripe retries — page someone, deduped per event type
    // so a sustained DB outage doesn't fan out into 100 identical alerts.
    void captureError(err, {
      event: 'webhook.handler-failed',
      eventType: event.type,
      eventId: event.id,
    });
    // 500 makes Stripe retry — appropriate for transient failures (DB, queue).
    return res.status(500).send('Handler error');
  }
}

async function handleSessionSucceeded(event) {
  const session = event.data.object;
  const projectId = session.metadata?.projectId;
  if (!projectId) {
    logger.warn({ sessionId: session.id }, 'webhook.no-project');
    return;
  }
  const customerEmail = session.customer_details?.email || session.metadata?.customerEmail;
  const productIds = (session.metadata?.productIds || '').split(',').filter(Boolean);

  await markPaid({
    projectId,
    stripeSessionId: session.id,
    paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    amountTotalCents: session.amount_total ?? 0,
    currency: session.currency ?? 'usd',
    customerEmail,
    productIds,
    shippingAddress: session.shipping_details?.address ?? null,
  });
  await auditRecord({
    actorKind: 'webhook', actorId: event.id, action: 'payment.succeeded',
    subjectKind: 'project', subjectId: projectId,
    metadata: { sessionId: session.id, amountTotalCents: session.amount_total, productIds },
  });

  // Load the saved canonical RenderInput from the project row.
  const project = await getById(projectId);
  let renderInput;
  try {
    renderInput = deserializeRenderInput(project?.render_input);
  } catch (err) {
    logger.error({ projectId, err: err.message }, 'webhook.bad-render-input');
    return;
  }

  // Enqueue the HD render. Dedupe key = Stripe session id so retried webhooks
  // don't enqueue duplicates.
  const renderId = crypto.randomUUID();
  await enqueueRender(
    { projectId, renderInput, productIds, renderId },
    { dedupeKey: `paid:${session.id}` },
  );
  metrics.incRendersEnqueued();
  logger.info({ projectId, renderId, productIds, eventId: event.id }, 'webhook.render-enqueued');
}

async function handleSessionFailed(event) {
  const session = event.data.object;
  const projectId = session.metadata?.projectId;
  if (!projectId) return;
  await markFailed({ projectId, reason: 'async_payment_failed', stripeSessionId: session.id });
  await auditRecord({
    actorKind: 'webhook', actorId: event.id, action: 'payment.failed',
    subjectKind: 'project', subjectId: projectId,
    metadata: { sessionId: session.id },
  });
  const customerEmail = session.customer_details?.email || session.metadata?.customerEmail;
  if (customerEmail) await sendFailureEmail({ to: customerEmail, projectId });
}

async function handleRefund(event) {
  const charge = event.data.object;
  // Stripe attaches our projectId to payment_intent metadata when we set it
  // via payment_intent_data.metadata in payments.checkout.js.
  const projectId =
    charge.metadata?.projectId ||
    charge.payment_intent_data?.metadata?.projectId;
  if (!projectId) return;
  await markRefunded({
    projectId,
    stripeChargeId: charge.id,
    amountRefundedCents: charge.amount_refunded,
  });
  await revokeProjectTokens(projectId);
  await auditRecord({
    actorKind: 'webhook', actorId: event.id, action: 'payment.refunded',
    subjectKind: 'project', subjectId: projectId,
    metadata: { chargeId: charge.id, amountRefundedCents: charge.amount_refunded },
  });
  logger.info({ projectId, chargeId: charge.id, eventId: event.id }, 'webhook.refunded');
}

module.exports = { webhookHandler, webhookRawParser };
