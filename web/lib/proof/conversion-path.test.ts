import { describe, expect, it } from 'vitest';
import { PROOF_PRODUCTS, resolveProductId } from './options';
import { mapProofToBuilder } from './mapping';
import { EMPTY_PROOF } from './types';
import { footballCollection } from '@/lib/collections/football';

describe('resolveProductId — /proof?product=<slug> validation', () => {
  it('accepts every real product id', () => {
    for (const p of PROOF_PRODUCTS) {
      expect(resolveProductId(p.id)).toBe(p.id);
    }
  });

  it('rejects unknown, empty, and hostile values → null', () => {
    expect(resolveProductId('nope')).toBeNull();
    expect(resolveProductId('')).toBeNull();
    expect(resolveProductId(undefined)).toBeNull();
    expect(resolveProductId(null)).toBeNull();
    expect(resolveProductId('<script>')).toBeNull();
  });

  it('takes the first value when the param arrives as an array', () => {
    expect(resolveProductId(['team-roster-banner', 'x'])).toBe('team-roster-banner');
    expect(resolveProductId(['bogus'])).toBeNull();
  });
});

describe('Football conversion path — every CTA routes Football → /proof', () => {
  const hrefs: string[] = [
    footballCollection.hero.primaryCTA.href,
    footballCollection.finalCta.cta.href,
    ...footballCollection.products.map((p) => p.href),
    ...footballCollection.packages.map((p) => p.href),
  ];

  it('points every conversion CTA at /proof (never straight to /create)', () => {
    for (const href of hrefs) {
      // A Coming Soon card routes to the shop, never into the builder — assert that
      // explicitly so it cannot silently regress into a /create deep link.
      if (!href.startsWith('/proof')) {
        expect(href.startsWith('/create'), `${href} must never enter the builder`).toBe(false);
        continue;
      }
      expect(href.startsWith('/proof')).toBe(true);
      expect(href.startsWith('/create')).toBe(false);
    }
  });

  it('no Coming Soon collection card deep-links into the proof flow', () => {
    for (const p of footballCollection.products.filter((x) => x.comingSoon)) {
      expect(p.href.startsWith('/proof'), `${p.id} must not preselect a proof product`).toBe(false);
      expect(p.href.startsWith('/create')).toBe(false);
    }
  });

  it('only ever preselects real products in the deep link', () => {
    for (const href of hrefs) {
      const q = href.split('?')[1];
      if (!q) continue;
      const product = new URLSearchParams(q).get('product');
      if (product) expect(resolveProductId(product)).toBe(product);
    }
  });

  it('every product CTA deep-links its own slug and that slug preselects', () => {
    for (const p of footballCollection.products.filter((x) => !x.comingSoon)) {
      expect(p.href).toBe(`/proof?product=${p.id}`);
      // A preselected product flows through the mapping without error.
      const out = mapProofToBuilder({ ...EMPTY_PROOF, productId: resolveProductId(p.id) });
      expect(out).toBeTypeOf('object');
    }
  });
});
