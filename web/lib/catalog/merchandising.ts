import { getProductBySlug, getProductsByCollection } from './products';
import type { Product } from './types';

/**
 * Merchandising helpers for product pages. All copy is factual and derived from catalog
 * data — no fabricated reviews, ratings, or guarantees. Audience/tip text is neutral
 * guidance, not a claim about outcomes.
 */

const RECOMMENDED_FOR: Record<Product['collectionSlug'], string[]> = {
  'team-banners': ['Varsity Teams', 'Youth Leagues', 'Booster Clubs'],
  graduation: ['Graduates & Families', 'Schools', 'Grad Parties'],
  championship: ['Champion Teams', 'Athletic Programs', 'Booster Clubs'],
  'social-graphics': ['Team Accounts', 'Coaches', 'Boosters'],
};

const COACH_TIP: Record<Product['productType'], string> = {
  banner: 'Upload one high-resolution hero photo — it prints sharpest at large banner sizes.',
  poster: 'Bright, well-lit photos make posters pop on the wall.',
  'yard-sign': 'Keep the name and year short so it reads clearly from the street.',
  collage: 'Pick a mix of close-ups and action shots for a balanced collage.',
  'social-graphic': 'Post it right after the game, while excitement is highest.',
  'social-pack': 'Space the graphics across the week to keep your feed active.',
};

export function getRecommendedFor(product: Product): string[] {
  return RECOMMENDED_FOR[product.collectionSlug];
}

export function getCoachTip(product: Product): string {
  return COACH_TIP[product.productType];
}

/** Factual "why customers choose this" bullets, adapted to the product's delivery. */
export function getWhyChoose(product: Product): string[] {
  const delivery =
    product.deliveryType === 'both'
      ? 'Available printed or as an instant digital download'
      : product.deliveryType === 'printed'
        ? 'Printed and shipped to you'
        : 'Instant digital download';
  return [
    'See a free design proof before you pay',
    'Personalized with your photos, colors, and text',
    delivery,
    'Secure checkout when you’re ready',
  ];
}

/**
 * "Frequently bought together": complementary products from the same collection with a
 * different product type (a banner pairs with a poster + a graphic, etc.). Falls back to
 * other collection members so the list is never empty. Always excludes the product itself.
 */
export function getFrequentlyBoughtTogether(product: Product, limit = 3): Product[] {
  const siblings = getProductsByCollection(product.collectionSlug).filter((p) => p.slug !== product.slug);
  const differentType = siblings.filter((p) => p.productType !== product.productType);
  const rest = siblings.filter((p) => p.productType === product.productType);
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const p of [...differentType, ...rest]) {
    if (seen.has(p.slug)) continue;
    seen.add(p.slug);
    out.push(p);
    if (out.length >= limit) break;
  }
  return out;
}

/** Resolve arbitrary slugs to products (used where merchandising references explicit slugs). */
export function resolveSlugs(slugs: string[]): Product[] {
  return slugs.map((s) => getProductBySlug(s)).filter((p): p is Product => Boolean(p));
}
