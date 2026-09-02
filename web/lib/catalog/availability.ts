/**
 * Product availability — which catalog products can actually be produced today.
 *
 * A product is sellable only if the render engine has a template that can produce it.
 * The engine (shared/render-engine) renders print/poster canvases from the six themes in
 * lib/themes.ts; it has NO square/story/social output path. So every `social-graphic` and
 * `social-pack` product is listed for discovery but cannot be designed or bought yet —
 * without this guard they would deep-link into the banner builder and a customer could pay
 * $9.99 for a product we cannot fulfil.
 *
 * Availability is derived from `productType` (the renderer capability) rather than a slug
 * list, so a social product added to the catalog later is unavailable by default instead of
 * silently becoming purchasable. COMING_SOON_SLUGS pins today's expected set for the tests.
 */

import type { Product, ProductType } from './types';

/** Product types the render engine cannot produce today. */
const UNSUPPORTED_TYPES: ReadonlySet<ProductType> = new Set<ProductType>([
  'social-graphic',
  'social-pack',
]);

/** The exact set expected to be Coming Soon today — pinned so a regression is a test failure. */
export const COMING_SOON_SLUGS: readonly string[] = [
  'graduation-social-graphic',
  'championship-social-pack',
  'game-day-graphic',
  'final-score-graphic',
  'player-of-the-game',
  'schedule-graphic',
  'thank-you-coach',
  'team-announcement',
];

/**
 * Public availability of ready-made art.
 *
 * The ready-made commerce engine is complete and tested, but a ready-made product can only
 * be sold once its APPROVED master artwork is stored and its S3 key configured
 * (READY_MADE_BEAUTY_ASSET_KEY on the API). Selling before then would take payment and hand
 * the customer a broken download — the exact failure this codebase has twice been bitten by.
 *
 * Flip to true only after the master asset is confirmed in place.
 */
export const READY_MADE_PUBLIC = false;

/** True when the product cannot be designed or purchased yet. */
export function isComingSoon(product: Product): boolean {
  if (UNSUPPORTED_TYPES.has(product.productType)) return true;
  // Ready-made art is listed for discovery but not purchasable until its master asset is
  // approved and stored.
  if (product.productMode === 'ready-made' && !READY_MADE_PUBLIC) return true;
  return false;
}

/** True when the product can enter the proof → builder → checkout flow. */
export function isSellable(product: Product): boolean {
  return !isComingSoon(product);
}

/** Copy used wherever an unavailable product is surfaced. Never implies a purchase. */
export const COMING_SOON_LABEL = 'Coming soon';
export const COMING_SOON_NOTE =
  'This design is not available to create or order yet. It is in development — check back soon.';

/** True when this product is a finished artwork sold exactly as shown (no builder). */
export function isReadyMade(product: Product): boolean {
  return product.productMode === 'ready-made';
}
