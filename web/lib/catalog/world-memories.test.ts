import { describe, expect, it } from 'vitest';
import { getAllProducts, getCollectionBySlug, getProductBySlug, getProductsByCollection } from './products';
import { proofHrefForProduct } from './proof-link';
import { isSellable, isComingSoon, COMING_SOON_SLUGS } from './availability';
import { PRICING, VIDEO_UPSELL_PUBLIC } from '@/lib/pricing';
import { PROOF_PRODUCTS, resolveProductId, productTitle } from '@/lib/proof/options';
import { PROOF_PRODUCT_MAP, mapProofToBuilder } from '@/lib/proof/mapping';
import { THEMES, THEME_DISPLAY, themeById } from '@/lib/themes';
import { SHOP_LINKS } from '@/lib/nav';
import { fitText, TEXT_SAFE_INSET } from '@celebratebanner/render-engine';

const SLUG = 'world-memories-photo-collage';
const PROOF_KEY = 'world-memories-collage';

describe('World Memories Photo Collage — catalog + discovery', () => {
  it('exists as a sellable catalog product', () => {
    const p = getProductBySlug(SLUG);
    expect(p, 'product must exist').toBeTruthy();
    expect(isSellable(p!)).toBe(true);
    expect(isComingSoon(p!)).toBe(false);
    expect(p!.name).toBe('World Memories Photo Collage');
  });

  it('carries the customer promise as its short description', () => {
    expect(getProductBySlug(SLUG)!.shortDescription).toBe(
      'Turn your favorite memories into one unforgettable personalized photo artwork.',
    );
  });

  it('is discoverable in its own collection and in the shop nav', () => {
    const collection = getCollectionBySlug('photo-collages');
    expect(collection, 'photo-collages collection must exist').toBeTruthy();
    expect(getProductsByCollection('photo-collages').map((p) => p.slug)).toContain(SLUG);
    expect(SHOP_LINKS.map((l) => l.href)).toContain('/shop/photo-collages');
  });

  it('uses the product-specific primary CTA', () => {
    expect(getProductBySlug(SLUG)!.ctaLabel).toBe('Create My Photo Collage');
  });
});

describe('World Memories Photo Collage — proof-first handoff', () => {
  it('the product CTA deep-links into the proof flow', () => {
    expect(proofHrefForProduct(getProductBySlug(SLUG)!)).toBe(`/proof?product=${PROOF_KEY}`);
  });

  it('its proof key resolves and is selectable in the wizard', () => {
    expect(resolveProductId(PROOF_KEY)).toBe(PROOF_KEY);
    expect(PROOF_PRODUCTS.map((o) => o.id)).toContain(PROOF_KEY);
    expect(productTitle(PROOF_KEY)).toBe('World Memories Photo Collage');
  });

  it('the handoff loads the product template, not a generic theme', () => {
    const map = PROOF_PRODUCT_MAP[PROOF_KEY];
    expect(map).toBeTruthy();
    expect(map!.themeId).toBe(SLUG);
    const prefill = mapProofToBuilder({
      productId: PROOF_KEY,
      team: { teamName: 'Our Ten Years', email: '', name: '', phone: '' },
    } as never);
    expect(prefill.themeId).toBe(SLUG);
    expect(prefill.text).toEqual({ title: 'Our Ten Years' });
  });

  it('the builder shows product identity instead of the generic theme grid', () => {
    // A theme absent from THEME_DISPLAY is a product configuration; create-flow hides the
    // generic picker for it so the customer cannot break product identity.
    expect(THEME_DISPLAY.some((t) => t.id === SLUG)).toBe(false);
    expect(THEMES[SLUG]).toBeDefined();
  });
});

describe('World Memories Photo Collage — template configuration', () => {
  it('offers a customizable headline and optional subtitle', () => {
    const theme = themeById(SLUG);
    expect(theme.fields).toEqual(['title', 'subtitle']);
    expect(theme.fieldMeta?.title?.placeholder).toBe('My Beautiful Memories');
  });

  it('does not hardcode the original one-off title', () => {
    const theme = themeById(SLUG);
    expect(JSON.stringify(theme)).not.toContain('The Beauty of the World');
  });

  it('the template id equals the product slug so orders identify the product', () => {
    // templateId flows into Stripe session metadata and projects.template_id.
    expect(themeById(SLUG).id).toBe(SLUG);
  });

  it('headlines are fitted by the certified safe-area text system', () => {
    const SAFE = 800 - TEXT_SAFE_INSET * 2;
    const font = (size: number) => `bold ${size}px "Cormorant Garamond", serif`;
    const stub = {
      font: '',
      measureText(text: string) {
        const m = /(\d+(?:\.\d+)?)px/.exec(stub.font);
        return { width: text.length * (m ? Number(m[1]) : 16) * 0.55 };
      },
    };
    const ctx = stub as unknown as Parameters<typeof fitText>[0];

    for (const headline of [
      'My Beautiful Memories',
      'The Beauty of the World',
      'Ten Unforgettable Years Of Travel, Family And Adventure Together',
    ]) {
      const fitted = fitText(ctx, headline, {
        maxWidth: SAFE, preferredSize: 64, minSize: 34, maxLines: 2, font,
      });
      stub.font = font(fitted.fontSize);
      const widest = fitted.lines.reduce(
        (max, line, i) => Math.max(max, stub.measureText(line).width * (fitted.compression[i] ?? 1)),
        0,
      );
      expect(widest, `"${headline}" must fit the safe area`).toBeLessThanOrEqual(SAFE + 0.5);
    }
  });
});

describe('World Memories Photo Collage — certified commerce, unchanged', () => {
  it('sells on the existing certified SKUs only', () => {
    expect(PRICING.print.amountCents).toBe(7999);
    expect(PRICING.digital.amountCents).toBe(999);
    expect(getProductBySlug(SLUG)!.startingPriceCents).toBe(7999);
    expect(getProductBySlug(SLUG)!.deliveryType).toBe('both');
  });

  it('introduces no video upsell', () => {
    expect(VIDEO_UPSELL_PUBLIC).toBe(false);
    const p = getProductBySlug(SLUG)!;
    expect(JSON.stringify(p)).not.toMatch(/video/i);
  });

  it('leaves the previously certified 16 products sellable and the 8 social ones Coming Soon', () => {
    const sellable = getAllProducts().filter(isSellable).map((p) => p.slug);
    expect(sellable).toContain(SLUG);
    expect(sellable).toHaveLength(17); // the certified 16 + this new product
    const comingSoon = getAllProducts().filter(isComingSoon).map((p) => p.slug).sort();
    expect(comingSoon).toEqual([...COMING_SOON_SLUGS].sort());
  });
});
