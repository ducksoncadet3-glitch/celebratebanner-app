import { describe, expect, it } from 'vitest';
import {
  getCoachTip,
  getFrequentlyBoughtTogether,
  getRecommendedFor,
  getWhyChoose,
} from './merchandising';
import { getAllProducts, getProductBySlug, getRelatedProducts } from './products';

const products = getAllProducts();

describe('frequently bought together', () => {
  it('is non-empty, excludes self, resolves, and respects the limit', () => {
    for (const p of products) {
      const fbt = getFrequentlyBoughtTogether(p, 3);
      expect(fbt.length).toBeGreaterThan(0);
      expect(fbt.length).toBeLessThanOrEqual(3);
      expect(fbt.some((x) => x.slug === p.slug)).toBe(false);
      for (const x of fbt) expect(getProductBySlug(x.slug)).toBeTruthy();
    }
  });
});

describe('product merchandising copy', () => {
  it('recommendedFor returns a non-empty audience list for every product', () => {
    for (const p of products) expect(getRecommendedFor(p).length).toBeGreaterThan(0);
  });

  it('coachTip returns a non-empty string for every product', () => {
    for (const p of products) expect(getCoachTip(p).length).toBeGreaterThan(0);
  });

  it('whyChoose returns four factual bullets', () => {
    for (const p of products) {
      const why = getWhyChoose(p);
      expect(why).toHaveLength(4);
      for (const line of why) expect(line.length).toBeGreaterThan(0);
    }
  });
});

describe('curated related cross-sells', () => {
  it('Team Banner recommends its curated cross-sells (incl. a cross-collection graphic)', () => {
    const slugs = getRelatedProducts('team-banner', 4).map((p) => p.slug);
    expect(slugs).toContain('team-poster');
    expect(slugs).toContain('coach-appreciation-banner');
    expect(slugs).toContain('schedule-graphic'); // cross-collection merchandising
  });

  it('every related list resolves and excludes self', () => {
    for (const p of products) {
      const rel = getRelatedProducts(p.slug, 4);
      expect(rel.length).toBeGreaterThan(0);
      expect(rel.some((r) => r.slug === p.slug)).toBe(false);
      for (const r of rel) expect(getProductBySlug(r.slug)).toBeTruthy();
    }
  });
});
