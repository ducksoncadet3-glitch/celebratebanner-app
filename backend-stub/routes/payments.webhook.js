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
const { markPaid, markFailed, markRefunded, markReady, getById } = require('../db/projects');
const { claimEvent, markEventOk, markEventFailed } = require('../db/webhook-events');
const { revokeProjectTokens } = require('../services/tokens');
const { enqueueRender } = require('../services/queue');
const { sendFailureEmail } = require('../services/mailer');
const { logger } = require('../services/logger');
const { metrics } = require('../services/metrics');
const { record: auditRecord } = require('../services/audit');
const { captureWarning, captureError } = require('../services/alerts');
const { deserializeRenderInput } = require('../utils/render-input');
const { readyMadeByTemplateId } = require('../config/ready-made-products');
const { issueDownloadToken } = require('../services/tokens');
const { sendDeliveryEmail } = require('../services/mailer');
const { rows } = require('../db');
const { recordEvent } = require('../db/analytics');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Fail loudly at boot if the signing secret is missing: without it EVERY event
// fails verification and 400s, silently dropping all paid orders. This turns a
// hard-to-diagnose "no orders arriving" incident into an obvious startup error.
if (!WEBHOOK_SECRET) {
  logger.error({}, 'webhook.missing-secret: STRIPE_WEBHOOK_SECRET is not set — all events will be rejected');
}

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
  if (claim.reclaimed) {
    // Re-processing a previously failed or orphaned event on a Stripe retry.
    logger.warn({ eventId: event.id, type: event.type }, 'webhook.reclaimed');
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

  // ── Ready-made fulfilment ──────────────────────────────────────────────────
  // A finished master artwork sold exactly as shown. There is no customer design, so this
  // path never reads render_input and never enqueues a render — it authorizes a download of
  // the stored master asset. Personalized orders fall through to the certified pipeline
  // below, unchanged.
  const readyMade = readyMadeByTemplateId(session.metadata?.templateId);
  if (readyMade) {
    try {
      await recordPurchaseEvent({ session, projectId, customerEmail });
    } catch (err) {
      logger.warn({ err: err.message, projectId }, 'analytics.purchase-failed');
    }
    await fulfillReadyMade({ readyMade, projectId, session, event, customerEmail });
    return;
  }

  // Load the saved canonical RenderInput from the project row.
  // Funnel event: the webhook is the ONLY authoritative source of a completed purchase.
  // Deduped on the Stripe session id, so a redelivered webhook cannot double-count revenue,
  // and a success-page visit is never counted at all.
  try {
    await recordPurchaseEvent({ session, projectId, customerEmail });
  } catch (err) {
    logger.warn({ err: err.message, projectId }, 'analytics.purchase-failed');
  }

  const project = await getById(projectId);
  let renderInput;
  try {
    renderInput = deserializeRenderInput(project?.render_input);
  } catch (err) {
    // The customer has PAID but the project carries no usable design — e.g. the row still
    // holds the empty `{"items":[]}` that createIfMissing seeds, or no autosave ever landed.
    //
    // Returning here (the old behavior) captured the money, answered Stripe 200 so the event
    // was never retried, and left the order with no job, no render and no delivery email —
    // invisible to everyone except a log line nobody was watching. A paid order must never
    // fail silently: raise a deduped alert and write an audit row so it is discoverable and
    // recoverable via POST /api/admin/projects/:id/rerender once the design is restored.
    //
    // Payment state is deliberately NOT altered: the charge succeeded and markPaid above is
    // correct. Only the render could not start.
    await captureError(err, {
      event: 'webhook.paid-order-not-renderable',
      projectId,
      sessionId: session.id,
      productIds,
      hint: 'Paid order has no usable render_input — customer will receive NO download email until re-rendered.',
    });
    await auditRecord({
      actorKind: 'webhook', actorId: event.id, action: 'payment.render_input_missing',
      subjectKind: 'project', subjectId: projectId,
      metadata: { sessionId: session.id, reason: err.message },
    });
    logger.error({ projectId, sessionId: session.id, err: err.message }, 'webhook.paid-order-not-renderable');
    metrics.incPaidOrdersNotRenderable();
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

/**
 * Fulfil a ready-made order: authorize a secure, expiring download of the approved master
 * asset and send the delivery email. No render, no S3 write, no image generation.
 *
 * Delivery idempotency: a download token already existing for this project means a previous
 * delivery (or a redelivered webhook) already fulfilled it, so we do not issue a second
 * token or send a second email. Stripe event-level dedupe is handled by claimEvent upstream;
 * this is the second line of defence.
 */
/**
 * Record a completed purchase for campaign reporting. Idempotent on the Stripe session id:
 * a redelivered webhook is a no-op, so revenue is never double-counted. Amount and currency
 * come from the Stripe session itself, so reported revenue equals what was actually charged.
 */
async function recordPurchaseEvent({ session, projectId, customerEmail }) {
  const md = session.metadata || {};
  const readyMade = readyMadeByTemplateId(md.templateId);
  await recordEvent({
    eventType: 'purchase_completed',
    productSlug: md.templateId || null,
    productMode: readyMade ? 'ready-made' : 'personalized',
    attribution: {
      utm_source: md.utmSource,
      utm_medium: md.utmMedium,
      utm_campaign: md.utmCampaign,
      utm_content: md.utmContent,
      attribution_id: md.attributionId,
    },
    projectId,
    sessionRef: session.id,
    amountCents: session.amount_total ?? 0,
    currency: session.currency ?? 'usd',
    dedupeKey: 'purchase_completed:' + session.id,
  });
}

async function fulfillReadyMade({ readyMade, projectId, session, event, customerEmail }) {
  const existing = await rows(
    'SELECT id FROM download_tokens WHERE project_id = $1 LIMIT 1',
    [projectId],
  );
  if (existing.length) {
    logger.info({ projectId, eventId: event.id }, 'readymade.already-delivered');
    await auditRecord({
      actorKind: 'webhook', actorId: event.id, action: 'readymade.delivery_deduped',
      subjectKind: 'project', subjectId: projectId,
      metadata: { sessionId: session.id, slug: readyMade.slug },
    });
    return;
  }

  // The master asset is never exposed as a public URL — this mints a tokenized link that
  // resolves to a short-lived signed S3 URL, with the same expiry and usage caps as a
  // rendered delivery.
  const download = await issueDownloadToken({
    projectId,
    assetType: readyMade.masterAssetType,
    s3Key: readyMade.masterAssetKey,
  });

  await markReady({ projectId });

  if (customerEmail) {
    await sendDeliveryEmail({
      to: customerEmail,
      projectId,
      // The slug selects ready-made copy — this order rendered nothing.
      templateId: readyMade.slug,
      links: { downloadUrl: download.url, expiresAt: download.expiresAt },
    });
  }

  await auditRecord({
    actorKind: 'webhook', actorId: event.id, action: 'readymade.delivered',
    subjectKind: 'project', subjectId: projectId,
    metadata: { sessionId: session.id, slug: readyMade.slug, assetType: readyMade.masterAssetType },
  });
  metrics.incEmailsSent('delivery');
  logger.info({ projectId, slug: readyMade.slug, eventId: event.id }, 'readymade.delivered');
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
