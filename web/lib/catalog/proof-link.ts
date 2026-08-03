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

export function proofHrefForProduct(product: Product): string {
  return proofHrefForKey(product.proofProductKey);
}
