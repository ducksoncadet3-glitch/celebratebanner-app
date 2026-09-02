'use strict';

/**
 * POST /api/events — first-party funnel events from the storefront.
 *
 * Only `product_view` is accepted from the browser. checkout_started and purchase_completed
 * are recorded SERVER-SIDE (checkout route and Stripe webhook) so they cannot be forged or
 * inflated by a client — a page refresh must never look like a sale.
 *
 * Privacy: the body carries a product slug and campaign tags only. No email, no IP, no user
 * agent, no fingerprint. `attributionId` is a random client value used solely to join a view
 * to its later checkout.
 *
 * Analytics must never break the storefront: this always answers 200 {ok:true}, even when
 * the write fails.
 */

const { recordEvent } = require('../db/analytics');
const { rateLimit } = require('../middleware/rate-limit');
const { logger } = require('../services/logger');

const ACCEPTED = new Set(['product_view']);
const MAX_SLUG = 64;

function str(v, max = MAX_SLUG) {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s ? s.slice(0, max) : null;
}

async function eventsHandler(req, res) {
  const body = req.body || {};
  const eventType = str(body.event, 32);

  if (!eventType || !ACCEPTED.has(eventType)) {
    // Deliberately not an error the client can distinguish — nothing is recorded.
    return res.status(202).json({ ok: true, recorded: false });
  }

  const mode = str(body.productMode, 16);
  try {
    await recordEvent({
      eventType,
      productSlug: str(body.productSlug),
      productMode: mode === 'ready-made' || mode === 'personalized' ? mode : null,
      attribution: {
        utm_source: body.utmSource,
        utm_medium: body.utmMedium,
        utm_campaign: body.utmCampaign,
        utm_content: body.utmContent,
        attribution_id: body.attributionId,
      },
    });
  } catch (err) {
    logger.warn({ err: err.message, eventType }, 'events.record-failed');
  }
  return res.status(202).json({ ok: true });
}

/** Middleware chain, mirroring uploads/downloads so server.js stays declarative. */
const middlewares = [rateLimit('events')];

module.exports = { eventsHandler, middlewares };
