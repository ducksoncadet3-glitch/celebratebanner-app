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

/** True when the product cannot be designed or purchased yet. */
export function isComingSoon(product: Product): boolean {
  return UNSUPPORTED_TYPES.has(product.productType);
}

/** True when the product can enter the proof → builder → checkout flow. */
export function isSellable(product: Product): boolean {
  return !isComingSoon(product);
}

/** Copy used wherever an unavailable product is surfaced. Never implies a purchase. */
export const COMING_SOON_LABEL = 'Coming soon';
export const COMING_SOON_NOTE =
  'This design is not available to create or order yet. It is in development — check back soon.';
