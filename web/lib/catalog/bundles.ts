import { getProductBySlug } from './products';
import { proofHrefForKey } from './proof-link';
import { poster } from './poster';
import type { Product, ProofProductKey } from './types';

/**
 * Featured merchandising bundles. A bundle is a curated grouping of REAL catalog products
 * (so names, links, and prices stay truthful) plus a lead proof key so "Build This Package"
 * opens the EXISTING proof flow preselected to the lead product. No bundle discount is
 * claimed — the starting price is simply the sum of the included products' starting prices.
 */
export interface Bundle {
  slug: string;
  name: string;
  tagline: string;
  /** Slugs of included catalog products (in display order). */
  productSlugs: string[];
  /** Existing proof product key the CTA deep-links to. */
  leadProofKey: ProofProductKey;
  /** Placeholder hero label. */
  heroLabel: string;
  featured?: boolean;
}

export const BUNDLES: Bundle[] = [
  {
    slug: 'gold-team-package',
    name: 'Gold Team Package',
    tagline: 'Everything to celebrate the whole team',
    productSlugs: ['team-banner', 'team-poster', 'game-day-graphic'],
    leadProofKey: 'team-roster-banner',
    heroLabel: 'TEAM PACK',
    featured: true,
  },
  {
    slug: 'graduation-package',
    name: 'Graduation Package',
    tagline: 'A complete set for the graduate',
    productSlugs: ['graduation-banner', 'graduation-poster', 'graduation-yard-sign'],
    leadProofKey: 'graduation-banner',
    heroLabel: 'GRAD PACK',
    featured: true,
  },
  {
    slug: 'championship-package',
    name: 'Championship Package',
    tagline: 'Mark the title from every angle',
    productSlugs: ['championship-banner', 'championship-poster', 'mvp-poster'],
    leadProofKey: 'championship-poster',
    heroLabel: 'CHAMPS PACK',
    featured: true,
  },
];

export function getAllBundles(): Bundle[] {
  return BUNDLES;
}

export function getBundleProducts(bundle: Bundle): Product[] {
  return bundle.productSlugs.map((s) => getProductBySlug(s)).filter((p): p is Product => Boolean(p));
}

/** Starting price = sum of included products' starting prices (no fabricated discount). */
export function bundleStartingCents(bundle: Bundle): number {
  return getBundleProducts(bundle).reduce((sum, p) => sum + p.startingPriceCents, 0);
}

/** "Build This Package" → the existing proof flow, preselected to the lead product. */
export function bundleProofHref(bundle: Bundle): string {
  return proofHrefForKey(bundle.leadProofKey);
}

export function bundleImage(bundle: Bundle): string {
  return poster(bundle.heroLabel, bundle.tagline, '16x9');
}
