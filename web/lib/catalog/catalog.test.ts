import { describe, expect, it } from 'vitest';
import {
  getAllCollections,
  getAllProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductsByCollection,
  getRelatedProducts,
} from './products';
import { proofHrefForProduct } from './proof-link';
import { isComingSoon, isReadyMade, isSellable, COMING_SOON_SLUGS } from './availability';
import { resolveProductId } from '@/lib/proof/options';

const products = getAllProducts();
const collections = getAllCollections();
const collectionSlugs = new Set(collections.map((c) => c.slug));

describe('catalog integrity', () => {
  it('contains exactly 26 products', () => {
    expect(products).toHaveLength(26);
  });

  it('every product has a unique slug', () => {
    const slugs = products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(products.length);
  });

  it('every product has a valid positive starting price in cents', () => {
    for (const p of products) {
      expect(Number.isInteger(p.startingPriceCents)).toBe(true);
      expect(p.startingPriceCents).toBeGreaterThan(0);
    }
  });

  it('enforces launch pricing business rules', () => {
    // Reconciled to what checkout can actually charge: every physical product $79.99,
    // every digital product $9.99. No physical product is advertised below $79.99.
    expect(getProductBySlug('senior-night-banner')!.startingPriceCents).toBe(7999);
    expect(getProductBySlug('team-banner')!.startingPriceCents).toBe(7999);
    expect(getProductBySlug('game-day-graphic')!.startingPriceCents).toBe(999);
    for (const p of products) {
      const isPhysical = p.deliveryType === 'printed' || p.deliveryType === 'both';
      if (isPhysical) expect(p.startingPriceCents).toBeGreaterThanOrEqual(7999);
    }
  });

  it('every product belongs to a valid collection', () => {
    for (const p of products) expect(collectionSlugs.has(p.collectionSlug)).toBe(true);
  });

  it('every SELLABLE personalized product has a proofProductKey the proof flow resolves', () => {
    for (const p of products.filter(isSellable).filter((x) => !isReadyMade(x))) {
      expect(resolveProductId(p.proofProductKey), p.slug).toBe(p.proofProductKey);
    }
  });

  it('a Coming Soon product key does NOT resolve, so it cannot preselect a design', () => {
    // Only assert for keys no sellable product shares — a shared key must stay resolvable.
    const sellableKeys = new Set(products.filter(isSellable).map((p) => p.proofProductKey));
    for (const p of products.filter(isComingSoon)) {
      if (sellableKeys.has(p.proofProductKey)) continue;
      expect(resolveProductId(p.proofProductKey), `${p.slug} must not preselect`).toBeNull();
    }
  });

  it('every related product slug resolves to a real product', () => {
    for (const p of products) {
      for (const rel of p.relatedProductSlugs) {
        expect(getProductBySlug(rel), `related slug ${rel} of ${p.slug}`).toBeTruthy();
      }
    }
  });

  it('every product has non-empty required copy fields', () => {
    for (const p of products) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.shortDescription.length).toBeGreaterThan(0);
      expect(p.fullDescription.length).toBeGreaterThan(0);
      expect(p.features.length).toBeGreaterThan(0);
      expect(p.faq.length).toBeGreaterThan(0);
      expect(p.seoTitle.length).toBeGreaterThan(0);
      expect(p.seoDescription.length).toBeGreaterThan(0);
      expect(p.image.startsWith('data:image/svg+xml,')).toBe(true);
    }
  });
});

describe('catalog helpers', () => {
  it('getFeaturedProducts returns the expected featured set', () => {
    const featured = getFeaturedProducts();
    expect(featured.map((p) => p.slug)).toEqual([
      'team-banner',
      'senior-night-banner',
      'graduation-banner',
      'graduation-poster',
      'championship-banner',
      'game-day-graphic',
    ]);
  });

  it('getProductsByCollection returns only that collection, and covers every product', () => {
    let total = 0;
    for (const c of collections) {
      const inC = getProductsByCollection(c.slug);
      expect(inC.length, `${c.slug} must not be empty`).toBeGreaterThan(0);
      for (const p of inC) expect(p.collectionSlug).toBe(c.slug);
      total += inC.length;
    }
    // Every product belongs to exactly one collection.
    expect(total).toBe(products.length);
  });

  it('there are 5 collections', () => {
    expect(collections).toHaveLength(5);
  });

  it('getProductBySlug returns undefined for an unknown slug (safe handling)', () => {
    expect(getProductBySlug('does-not-exist')).toBeUndefined();
  });

  it('getRelatedProducts excludes self, resolves, and never exceeds the limit', () => {
    for (const p of products) {
      const related = getRelatedProducts(p.slug, 3);
      expect(related.length).toBeLessThanOrEqual(3);
      expect(related.some((r) => r.slug === p.slug)).toBe(false);
    }
    expect(getRelatedProducts('does-not-exist')).toEqual([]);
  });
});

describe('proof CTA URL', () => {
  it('produces /proof?product=<resolvable key> for every SELLABLE personalized product', () => {
    const sellable = products.filter(isSellable).filter((p) => !isReadyMade(p));
    expect(sellable.length).toBeGreaterThan(0);
    for (const p of sellable) {
      const href = proofHrefForProduct(p);
      expect(href, `${p.slug} must have a proof link`).toBe(`/proof?product=${p.proofProductKey}`);
      const key = new URLSearchParams((href as string).split('?')[1]).get('product');
      expect(resolveProductId(key)).toBe(key);
    }
  });

  it('produces NO proof link for a Coming Soon product', () => {
    const comingSoon = products.filter(isComingSoon);
    expect(comingSoon.length).toBeGreaterThanOrEqual(COMING_SOON_SLUGS.length);
    for (const p of comingSoon) {
      expect(proofHrefForProduct(p), `${p.slug} must not deep-link into the proof flow`).toBeNull();
    }
  });
});
