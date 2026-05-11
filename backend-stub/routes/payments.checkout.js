/**
 * POST /api/payments/checkout
 *
 * Creates a Stripe Checkout Session for the requested products and returns the
 * redirect URL to the frontend. All charge amounts are re-priced from the
 * server's authoritative PRICING table — the client never sets the amount.
 *
 * Body shape (validated below):
 *   {
 *     projectId:      string,                 // required, opaque to Stripe
 *     templateId:     string,                 // required, opaque to Stripe
 *     renderType:     'standard' | 'premium', // required
 *     customerEmail:  string,                 // required, basic format check
 *     items:          [{ productId: 'digital'|'print'|'video', quantity?: number }],
 *     couponCode?:    string,                 // optional, looked up server-side
 *     affiliateRef?:  string,                 // optional, recorded in metadata
 *     recoveryToken?: string                  // optional, abandoned-cart token
 *   }
 *
 * Returns:
 *   200 { url, sessionId }
 *   400 { error } on validation failure
 *   500 { error } on Stripe failure (frontend may redirect to legacy link)
 */

const Stripe = require('stripe');
const { priceFor, ALLOWED_PRODUCT_IDS, isProductId } = require('../lib/pricing');
const { createProjectIfMissing } = require('../services/projects');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE = process.env.PUBLIC_SITE_URL || 'https://celebratebanner.com';

async function checkoutHandler(req, res) {
  try {
    const body = req.body ?? {};
    const errors = validate(body);
    if (errors.length) return res.status(400).json({ error: errors.join('; ') });

    const items = body.items.map((line) => {
      const p = priceFor(line.productId);
      return {
        price_data: {
          currency: 'usd',
          unit_amount: p.amountCents,
          product_data: {
            name: p.label,
            description: p.description,
            metadata: { productId: p.id, fulfillment: p.fulfillment },
          },
        },
        quantity: Math.max(1, Math.min(10, Number(line.quantity) || 1)),
      };
    });

    // Discounts / coupons / affiliates: resolved server-side. Each hook is a
    // pure function — implement when you're ready, the wiring is already here.
    const discounts = await resolveDiscounts(body);
    const automaticTax = { enabled: false }; // flip on once Stripe Tax is configured

    // Ensure a project row exists before checkout so the webhook can update it.
    await createProjectIfMissing({
      projectId: body.projectId,
      templateId: body.templateId,
      renderType: body.renderType,
      customerEmail: body.customerEmail,
      items: body.items.map((i) => i.productId),
    });

    const requiresShipping = items.some((i) =>
      isProductId(i.price_data.product_data.metadata.productId) &&
      priceFor(i.price_data.product_data.metadata.productId).requiresShipping,
    );

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: body.customerEmail,
      line_items: items,
      automatic_tax: automaticTax,
      ...(discounts.length ? { discounts } : {}),
      ...(requiresShipping
        ? {
            shipping_address_collection: { allowed_countries: ['US', 'CA'] },
            phone_number_collection: { enabled: true },
          }
        : {}),
      // Metadata flows back to us via the webhook + lives on the Session forever.
      metadata: {
        projectId: body.projectId,
        templateId: body.templateId,
        renderType: body.renderType,
        customerEmail: body.customerEmail,
        affiliateRef: body.affiliateRef ?? '',
        recoveryToken: body.recoveryToken ?? '',
        productIds: body.items.map((i) => i.productId).join(','),
      },
      payment_intent_data: {
        metadata: {
          projectId: body.projectId,
          productIds: body.items.map((i) => i.productId).join(','),
        },
      },
      success_url: `${SITE}/success?session_id={CHECKOUT_SESSION_ID}&project_id=${encodeURIComponent(body.projectId)}`,
      cancel_url: `${SITE}/cancel?project_id=${encodeURIComponent(body.projectId)}`,
      // Future: allow_promotion_codes once you wire up Stripe Coupons.
      allow_promotion_codes: false,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    // Log full error server-side, return a generic message to the client.
    console.error('[checkout] failed', err);
    return res.status(500).json({ error: 'Could not start checkout. Please try again.' });
  }
}

function validate(body) {
  const errs = [];
  if (!body || typeof body !== 'object') return ['Invalid body'];
  if (!body.projectId || typeof body.projectId !== 'string') errs.push('projectId required');
  if (!body.templateId || typeof body.templateId !== 'string') errs.push('templateId required');
  if (!['standard', 'premium'].includes(body.renderType)) errs.push('renderType must be standard|premium');
  if (!body.customerEmail || !EMAIL_RE.test(body.customerEmail)) errs.push('valid customerEmail required');
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errs.push('items[] required');
  } else {
    for (const i of body.items) {
      if (!i || !isProductId(i.productId)) {
        errs.push(`items[].productId must be one of ${ALLOWED_PRODUCT_IDS.join('|')}`);
        break;
      }
    }
  }
  return errs;
}

/**
 * Stub for future coupon/affiliate logic. Today this returns []; populate it
 * when you build the Coupons collection. Stripe accepts `discounts` only when
 * non-empty, so we spread it conditionally above.
 */
async function resolveDiscounts(body) {
  const out = [];
  if (body.couponCode) {
    // Example: look up your internal Coupon table, then push { coupon: 'stripe_coupon_id' }
    // or { promotion_code: 'promo_…' }. Left intentionally empty until coupons ship.
  }
  return out;
}

module.exports = { checkoutHandler };
