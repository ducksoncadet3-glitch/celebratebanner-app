'use strict';

/**
 * Ready-made product registry.
 *
 * A ready-made product is a FINISHED master artwork sold exactly as shown. The customer
 * never uploads a photo, never enters the builder, and nothing is rendered for them — so
 * this path deliberately has no render_input, no BullMQ job and no image generation. The
 * purchase is fulfilled by issuing a secure, expiring download authorization for a master
 * asset that is stored once.
 *
 * The webhook identifies the mode from the Stripe session's `templateId` metadata, which
 * already travels with every checkout. A templateId present here is ready-made; anything
 * else keeps the certified personalized render pipeline untouched.
 *
 * Dependency-free on purpose: the pre-deploy suite runs `node --test` with no npm install.
 */

const READY_MADE = {
  'the-beauty-of-the-world': {
    productMode: 'ready-made',
    slug: 'the-beauty-of-the-world',
    name: 'The Beauty of the World',
    digitalPriceCents: 999,
    printPriceCents: 7999,
    /**
     * S3 key of the approved master artwork, supplied by configuration. There is NO
     * default: the key must name an artwork explicitly approved for commercial sale.
     * NEVER served directly — downloads always go through an expiring signed token.
     */
    masterAssetKey: process.env.READY_MADE_BEAUTY_ASSET_KEY || null,
    /** Asset type recorded on the download token (drives content-type + metrics). */
    masterAssetType: 'jpeg',
    /**
     * Printed fulfilment for ready-made art is NOT certified yet: the print path has only
     * ever been exercised for rendered, per-customer designs. Digital is unaffected and
     * ships today — see the launch report. Flip to true only after a controlled print run.
     */
    printFulfillmentCertified: false,
    /**
     * ACTIVE ONLY WHEN THE MASTER ASSET IS CONFIGURED. There is deliberately no fallback
     * key: a guessed or missing object would mean a customer pays and the download 404s.
     * Set READY_MADE_BEAUTY_ASSET_KEY (Fly secret) to the approved artwork's S3 key.
     */
    get active() {
      return Boolean(this.masterAssetKey);
    },
  },
};

/** The ready-made product for a templateId, or null when this is a personalized order. */
function readyMadeByTemplateId(templateId) {
  if (!templateId || typeof templateId !== 'string') return null;
  const p = READY_MADE[templateId];
  return p && p.active ? p : null;
}

/** True when this checkout must skip the render pipeline entirely. */
function isReadyMade(templateId) {
  return readyMadeByTemplateId(templateId) !== null;
}

/** Product ids a ready-made product can currently be sold as. */
function purchasableProductIds(product) {
  const ids = ['digital'];
  if (product && product.printFulfillmentCertified) ids.push('print');
  return ids;
}

module.exports = {
  READY_MADE,
  readyMadeByTemplateId,
  isReadyMade,
  purchasableProductIds,
};
