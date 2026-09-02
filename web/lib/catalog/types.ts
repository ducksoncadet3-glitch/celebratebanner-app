/**
 * Storefront catalog types. Strictly typed so the whole store (routes, cards, SEO, tests)
 * is derived from one source of truth in lib/catalog/products.ts.
 */

export type CollectionSlug =
  | 'team-banners'
  | 'graduation'
  | 'championship'
  | 'social-graphics'
  | 'photo-collages';

export type ProductType = 'banner' | 'poster' | 'yard-sign' | 'collage' | 'social-graphic' | 'social-pack';

export type DeliveryType = 'printed' | 'digital' | 'both';

/**
 * The proof-flow product key. MUST be one of the ids the existing proof wizard already
 * understands (lib/proof/options.ts PROOF_PRODUCTS ⊇ lib/proof/mapping.ts PROOF_PRODUCT_MAP),
 * so a catalog CTA deep-links into the existing /proof → builder handoff with no changes to
 * that flow. Business-logic mapping only — never derived from display names.
 */
export type ProofProductKey =
  | 'team-roster-banner'
  | 'senior-night-banner'
  | 'championship-poster'
  | 'player-spotlight-poster'
  | 'coach-recognition-banner'
  | 'football-social-graphics'
  | 'graduation-banner'
  | 'world-memories-collage'
  | 'the-beauty-of-the-world';

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductFaq {
  q: string;
  a: string;
}

export interface Product {
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  collectionSlug: CollectionSlug;
  /** Integer USD cents (single source of truth); display via formatUSD(). */
  startingPriceCents: number;
  /** Marketing price line, e.g. "From $79.99". */
  priceLabel: string;
  /** Primary image (data URI placeholder today — see lib/catalog/poster.ts). */
  image: string;
  gallery: string[];
  badge?: string;
  featured?: boolean;
  bestSeller?: boolean;
  productType: ProductType;
  deliveryType: DeliveryType;
  availableSizes: string[];
  features: string[];
  specifications: ProductSpec[];
  faq: ProductFaq[];
  relatedProductSlugs: string[];
  proofProductKey: ProofProductKey;
  /** Product-specific primary CTA. Falls back to the standard proof CTA when absent. */
  ctaLabel?: string;
  /**
   * How the customer obtains this product.
   *   • 'personalized' (default) — proof-first: upload, customize, preview, then buy.
   *   • 'ready-made'  — a finished master artwork sold exactly as shown. No builder, no
   *     upload, no render. Fulfilled from a stored master asset (backend-stub/config/
   *     ready-made-products.js) via an expiring signed download.
   */
  productMode?: 'personalized' | 'ready-made';
  /** Slug of the product to cross-sell from this one. */
  crossSellSlug?: string;
  sportTags: string[];
  occasionTags: string[];
  seoTitle: string;
  seoDescription: string;
}

export interface Collection {
  slug: CollectionSlug;
  name: string;
  tagline: string;
  description: string;
  /** Short label rendered in the placeholder hero poster. */
  heroLabel: string;
  seoTitle: string;
  seoDescription: string;
}
