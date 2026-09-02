import { describe, expect, it } from 'vitest';
import { getProductBySlug, getAllProducts } from '@/lib/catalog/products';
import { getWhyChoose } from '@/lib/catalog/merchandising';

/**
 * A ready-made page must never claim the customer designs the thing they are buying.
 *
 * The storefront's shared merchandising blocks (why-choose bullets, the specifications
 * table, the common FAQ) were written for personalized products, and they were rendering
 * verbatim on the finished-artwork page: "See your free design preview before you pay",
 * "Personalized with your photos, colors, and text", "add your photos, and personalize your
 * design". Each is false for a product sold exactly as shown.
 */

const SLUG = 'the-beauty-of-the-world';
const beauty = getProductBySlug(SLUG)!;

/**
 * Claims that are only true when the customer creates the artwork. Phrases, not bare words:
 * "nothing to upload" is exactly the copy we WANT, so forbidding "upload" would be wrong.
 */
const PERSONALIZATION_CLAIMS = [
  'personalized with your photos',
  'add your photos',
  'upload your photos',
  'personalize your design',
  'free design preview',
  'during customization',
  'in the builder',
];

describe('the ready-made product record', () => {
  it('is ready-made, digital, $9.99', () => {
    expect(beauty.productMode).toBe('ready-made');
    expect(beauty.deliveryType).toBe('digital');
    expect(beauty.startingPriceCents).toBe(999);
    expect(beauty.priceLabel).toBe('$9.99');
  });

  it('makes no personalization claim anywhere in its own copy', () => {
    // The cross-sell answer is excluded and checked separately: it is ALLOWED to describe
    // the personalized alternative, because it explicitly frames it as a different product.
    const ownFaq = beauty.faq.filter((f) => !/own photos/i.test(f.q));
    const surfaces = [
      beauty.shortDescription,
      beauty.fullDescription,
      ...getWhyChoose(beauty),
      ...beauty.specifications.map((s) => `${s.label} ${s.value}`),
      ...ownFaq.flatMap((f) => [f.q, f.a]),
    ].join(' \n ').toLowerCase();

    for (const claim of PERSONALIZATION_CLAIMS) {
      expect(surfaces, `ready-made copy must not claim "${claim}"`).not.toContain(claim);
    }
  });

  it('says plainly what it IS', () => {
    const why = getWhyChoose(beauty);
    expect(why).toContain('Finished artwork — exactly as shown');
    expect(why).toContain('Nothing to upload, nothing to design');
    expect(why).toContain('Instant digital download');
  });

  it('drops the Personalization specification row', () => {
    expect(beauty.specifications.map((s) => s.label)).not.toContain('Personalization');
    // The factual rows survive.
    expect(beauty.specifications.map((s) => s.label)).toContain('Files');
  });

  it('answers the questions a ready-made buyer actually has', () => {
    const qs = beauty.faq.map((f) => f.q);
    expect(qs).toContain('Do I need to design anything?');
    expect(qs).toContain('How do I get my file after paying?');
    expect(qs).not.toContain('Do I pay before I see my design?');
  });

  it('still points at the personalized alternative, framed as a DIFFERENT product', () => {
    expect(beauty.crossSellSlug).toBe('world-memories-photo-collage');
    const crossSell = beauty.faq.find((f) => /own photos/i.test(f.q));
    expect(crossSell, 'the cross-sell question must exist').toBeDefined();
    expect(crossSell!.a).toContain('that is a different product');
    expect(crossSell!.a).toContain('World Memories Photo Collage');
  });
});

describe('personalized products are unaffected', () => {
  const wm = getProductBySlug('world-memories-photo-collage')!;

  it('World Memories is still personalized, with its personalized copy intact', () => {
    expect(wm.productMode).toBe('personalized');
    expect(getWhyChoose(wm)).toContain('Personalized with your photos, colors, and text');
    expect(getWhyChoose(wm)).toContain('See your free design preview before you pay');
    expect(wm.specifications.map((s) => s.label)).toContain('Personalization');
    expect(wm.faq.map((f) => f.q)).toContain('Do I pay before I see my design?');
  });

  it('every OTHER product in the catalog keeps the personalized blocks', () => {
    for (const p of getAllProducts().filter((x) => x.productMode !== 'ready-made')) {
      expect(getWhyChoose(p), p.slug).toContain('See your free design preview before you pay');
      expect(p.faq.map((f) => f.q), p.slug).toContain('Do I pay before I see my design?');
    }
  });

  it('the ready-made page is the only one that changed', () => {
    const readyMade = getAllProducts().filter((p) => p.productMode === 'ready-made');
    expect(readyMade.map((p) => p.slug)).toEqual([SLUG]);
  });
});
