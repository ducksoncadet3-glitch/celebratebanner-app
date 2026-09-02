import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getAllProducts, getProductBySlug } from './products';
import { proofHrefForProduct } from './proof-link';
import { isComingSoon, isReadyMade, READY_MADE_PUBLIC } from './availability';
import { PRICING, VIDEO_UPSELL_PUBLIC } from '@/lib/pricing';
import { PROOF_PRODUCTS, resolveProductId } from '@/lib/proof/options';
import { PROOF_PRODUCT_MAP } from '@/lib/proof/mapping';

/**
 * "The Beauty of the World" is a READY-MADE product: a finished master artwork sold exactly
 * as shown. The customer never uploads, never enters the builder, and nothing is rendered.
 * These tests pin that separation, and that the personalized product beside it is untouched.
 */

const READY = 'the-beauty-of-the-world';
const PERSONALIZED = 'world-memories-photo-collage';
const WEB_ROOT = process.cwd();

describe('The Beauty of the World — ready-made product', () => {
  it('exists and is marked ready-made', () => {
    const p = getProductBySlug(READY);
    expect(p, 'product must exist').toBeTruthy();
    expect(p!.name).toBe('The Beauty of the World');
    expect(p!.productMode).toBe('ready-made');
    expect(isReadyMade(p!)).toBe(true);
  });

  it('is purchasable now that the approved master asset is stored and configured', () => {
    // The gate opened only after the master was copied byte-identically to its stable key
    // and READY_MADE_BEAUTY_ASSET_KEY was set on the API.
    expect(READY_MADE_PUBLIC).toBe(true);
    expect(isComingSoon(getProductBySlug(READY)!)).toBe(false);
  });

  it('carries the ready-made promise and CTA', () => {
    const p = getProductBySlug(READY)!;
    expect(p.shortDescription).toBe('Purchase this finished artwork exactly as shown.');
    expect(p.ctaLabel).toBe('View & Buy');
  });

  it('NEVER enters the builder or proof flow', () => {
    const p = getProductBySlug(READY)!;
    expect(proofHrefForProduct(p), 'ready-made must have no proof deep link').toBeNull();
    // It must also not be offered as a wizard product, which would start a design.
    expect(PROOF_PRODUCTS.map((o) => o.id)).not.toContain(READY);
    expect(resolveProductId(READY)).toBeNull();
    expect(PROOF_PRODUCT_MAP[READY]).toBeUndefined();
  });

  it('sells digital at the certified $9.99', () => {
    const p = getProductBySlug(READY)!;
    expect(p.startingPriceCents).toBe(999);
    expect(PRICING.digital.amountCents).toBe(999);
    expect(p.deliveryType).toBe('digital');
  });

  it('printed is gated: the product does not advertise a print offer yet', () => {
    // Print stays gated until ready-made print fulfilment is separately certified. Digital
    // must not be blocked by that gate.
    expect(getProductBySlug(READY)!.deliveryType).toBe('digital');
    expect(PRICING.print.amountCents).toBe(7999); // the certified SKU still exists
  });

  it('the product page checks out directly instead of rendering a proof CTA', () => {
    const page = readFileSync(path.join(WEB_ROOT, 'app/products/[slug]/page.tsx'), 'utf8');
    expect(page).toContain('isReadyMade');
    expect(page).toContain('CheckoutButton');
    // templateId carries the slug, which is how the webhook identifies the ready-made order.
    expect(page).toContain('templateId={product.slug}');
  });

  it('introduces no video upsell', () => {
    expect(VIDEO_UPSELL_PUBLIC).toBe(false);
    expect(JSON.stringify(getProductBySlug(READY)!)).not.toMatch(/video/i);
  });
});

describe('the two products are distinct and cross-sell each other', () => {
  it('World Memories remains PERSONALIZED and unchanged', () => {
    const p = getProductBySlug(PERSONALIZED);
    expect(p, 'World Memories must still exist').toBeTruthy();
    expect(p!.productMode).toBe('personalized');
    expect(p!.ctaLabel).toBe('Create My Photo Collage');
    expect(isReadyMade(p!)).toBe(false);
    // Its certified proof-first flow is untouched.
    expect(proofHrefForProduct(p!)).toBe('/proof?product=world-memories-collage');
    expect(PROOF_PRODUCT_MAP['world-memories-collage']).toBeTruthy();
  });

  it('each points at the other', () => {
    expect(getProductBySlug(READY)!.crossSellSlug).toBe(PERSONALIZED);
    expect(getProductBySlug(PERSONALIZED)!.crossSellSlug).toBe(READY);
    // Both cross-sell targets resolve to real products.
    expect(getProductBySlug(getProductBySlug(READY)!.crossSellSlug!)).toBeTruthy();
    expect(getProductBySlug(getProductBySlug(PERSONALIZED)!.crossSellSlug!)).toBeTruthy();
  });

  it('the product page renders the cross-sell copy for both directions', () => {
    const page = readFileSync(path.join(WEB_ROOT, 'app/products/[slug]/page.tsx'), 'utf8');
    expect(page).toContain('Want one made with your own photos?');
    expect(page).toContain('Prefer a finished artwork?');
    expect(page).toContain('Create a World Memories Photo Collage');
    expect(page).toContain('Discover The Beauty of the World');
  });

  it('every personalized product still has a proof link; only ready-made ones do not', () => {
    for (const p of getAllProducts().filter((x) => !isComingSoon(x))) {
      if (isReadyMade(p)) expect(proofHrefForProduct(p), p.slug).toBeNull();
      else expect(proofHrefForProduct(p), p.slug).toBe(`/proof?product=${p.proofProductKey}`);
    }
  });
});

describe('post-purchase returns the customer to the store', () => {
  it('the success page offers download, discover, and continue shopping', () => {
    const view = readFileSync(path.join(WEB_ROOT, 'components/success-view.tsx'), 'utf8');
    expect(view).toContain('Download Your Artwork');
    expect(view).toContain('Discover More CelebrateBanner Designs');
    expect(view).toContain('Continue Shopping');
    expect(view).toContain('https://www.celebratebanner.com/');
  });

  it('the delivery email links back to the store', () => {
    const tpl = readFileSync(
      path.join(WEB_ROOT, '..', 'backend-stub/email/templates/delivery.js'),
      'utf8',
    );
    expect(tpl).toContain('https://www.celebratebanner.com/');
    expect(tpl).toContain('Discover More CelebrateBanner Designs');
  });
});
