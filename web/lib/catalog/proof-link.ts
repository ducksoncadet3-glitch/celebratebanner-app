import { isComingSoon } from './availability';
import type { Product } from './types';

/**
 * Builds the deep-link into the EXISTING proof flow: /proof?product=<proofProductKey>.
 *
 * The key is `product.proofProductKey` — an explicit catalog field that is one of the ids
 * the proof wizard already validates (lib/proof/options.ts resolveProductId) and maps to a
 * builder theme (lib/proof/mapping.ts). Mapping is data-driven, never derived from the
 * display name. Unknown keys can't occur (typed union), and if one ever did the proof page
 * already falls back safely to "no preselection".
 */
export function proofHrefForKey(key: string): string {
  return `/proof?product=${encodeURIComponent(key)}`;
}

/**
 * The proof deep-link for a product, or `null` when the product is not sellable yet.
 *
 * Returning null (rather than a string) makes the Coming Soon case a TYPE-level concern:
 * a caller must handle it explicitly and cannot accidentally render a live CTA into the
 * proof/builder/checkout flow for a product the renderer cannot produce.
 */
export function proofHrefForProduct(product: Product): string | null {
  if (isComingSoon(product)) return null;
  // Ready-made art is sold exactly as shown: there is nothing to design, so it must never
  // enter the proof/builder flow. Its product page renders a direct checkout instead.
  if (product.productMode === 'ready-made') return null;
  return proofHrefForKey(product.proofProductKey);
}
