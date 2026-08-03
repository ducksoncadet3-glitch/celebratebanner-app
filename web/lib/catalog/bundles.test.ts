import { describe, expect, it } from 'vitest';
import {
  bundleProofHref,
  bundleStartingCents,
  getAllBundles,
  getBundleProducts,
} from './bundles';
import { getProductBySlug } from './products';
import { resolveProductId } from '@/lib/proof/options';

const bundles = getAllBundles();

describe('featured bundles', () => {
  it('defines the three featured bundles', () => {
    expect(bundles.map((b) => b.slug)).toEqual(['gold-team-package', 'graduation-package', 'championship-package']);
  });

  it('every included product slug resolves to a real product', () => {
    for (const b of bundles) {
      expect(b.productSlugs.length).toBeGreaterThanOrEqual(3);
      for (const slug of b.productSlugs) {
        expect(getProductBySlug(slug), `${b.slug} → ${slug}`).toBeTruthy();
      }
    }
  });

  it('starting price equals the sum of included product prices (no fabricated discount)', () => {
    for (const b of bundles) {
      const sum = getBundleProducts(b).reduce((s, p) => s + p.startingPriceCents, 0);
      expect(bundleStartingCents(b)).toBe(sum);
      expect(sum).toBeGreaterThan(0);
    }
  });

  it('"Build This Package" opens the existing proof flow with a resolvable product key', () => {
    for (const b of bundles) {
      const href = bundleProofHref(b);
      expect(href).toBe(`/proof?product=${b.leadProofKey}`);
      const key = new URLSearchParams(href.split('?')[1]).get('product');
      expect(resolveProductId(key)).toBe(key);
    }
  });
});
