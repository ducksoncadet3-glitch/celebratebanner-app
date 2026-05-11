/**
 * Server-side pricing constants — the AUTHORITATIVE source of charge amounts.
 *
 * Keep this file in sync with web/lib/pricing.ts on the frontend. The frontend
 * uses its copy purely for display; the server re-prices every Checkout Session
 * from this file, so the client cannot tamper with the amount.
 *
 * Amounts are in USD cents.
 */

const PRICING = {
  digital: {
    id: 'digital',
    label: 'CelebrateBanner — Digital Banner',
    description: '300 DPI print-ready PDF + JPG, instant download.',
    amountCents: 999,
    fulfillment: 'digital',
    requiresShipping: false,
  },
  print: {
    id: 'print',
    label: 'CelebrateBanner — Printed Banner (24×36")',
    description: 'Professionally printed 24×36" vinyl banner with grommets, ships in 3–5 days.',
    amountCents: 4900,
    fulfillment: 'print',
    requiresShipping: true,
  },
  video: {
    id: 'video',
    label: 'CelebrateBanner — Video Slideshow',
    description: '60-second cinematic slideshow with music + motion.',
    amountCents: 1900,
    fulfillment: 'video',
    requiresShipping: false,
  },
};

const ALLOWED_PRODUCT_IDS = Object.keys(PRICING);

function isProductId(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(PRICING, id);
}

function priceFor(productId) {
  if (!isProductId(productId)) throw new Error(`Unknown product id: ${productId}`);
  return PRICING[productId];
}

module.exports = { PRICING, ALLOWED_PRODUCT_IDS, isProductId, priceFor };
