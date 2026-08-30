import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PRICING } from '@/lib/pricing';
import { getAllProducts, priceLabelFor } from './products';
import { productOffer } from './structured-data';

/**
 * Launch guard: every customer-facing price must be an amount checkout can actually charge.
 * Fails if the storefront catalog, the web checkout constants, or the backend pricing drift
 * apart, or if a product advertises a physical price below the reconciled $79.99 floor.
 */

const products = getAllProducts();
const isPhysical = (d: string) => d === 'printed' || d === 'both';

// Read the backend's authoritative charge amounts from source (no cross-package import), so
// this test also fails if web/lib/pricing.ts and backend-stub/lib/pricing.js diverge.
function backendAmounts(): Record<string, number> {
  const root = path.resolve(process.cwd(), '..'); // vitest runs from web/
  const src = readFileSync(path.join(root, 'backend-stub/lib/pricing.js'), 'utf8');
  const out: Record<string, number> = {};
  for (const id of ['digital', 'print', 'video']) {
    const m = src.match(new RegExp(`${id}:\\s*\\{[^}]*?amountCents:\\s*(\\d+)`, 's'));
    if (m) out[id] = Number(m[1]);
  }
  return out;
}

describe('pricing consistency (storefront ↔ checkout ↔ backend)', () => {
  it('storefront physical minimum equals the checkout print price', () => {
    const physicalMin = Math.min(
      ...products.filter((p) => isPhysical(p.deliveryType)).map((p) => p.startingPriceCents),
    );
    expect(physicalMin).toBe(PRICING.print.amountCents); // 7999
  });

  it('storefront digital minimum equals the checkout digital price', () => {
    const digitalMin = Math.min(
      ...products.filter((p) => p.deliveryType === 'digital').map((p) => p.startingPriceCents),
    );
    expect(digitalMin).toBe(PRICING.digital.amountCents); // 999
  });

  it('backend and web checkout pricing do not diverge', () => {
    const backend = backendAmounts();
    expect(backend.digital).toBe(PRICING.digital.amountCents);
    expect(backend.print).toBe(PRICING.print.amountCents);
    expect(backend.video).toBe(PRICING.video.amountCents);
  });

  it('every advertised / JSON-LD price is an amount checkout can actually charge', () => {
    // The product page renders PriceDisplay(startingPriceCents) and emits JSON-LD
    // offers.price = startingPriceCents / 100. Both must equal a real charge:
    // physical → print price, digital → digital price.
    for (const p of products) {
      const charge = isPhysical(p.deliveryType) ? PRICING.print.amountCents : PRICING.digital.amountCents;
      expect(p.startingPriceCents, p.slug).toBe(charge);
    }
  });

  it('no stale sub-$79.99 physical prices remain', () => {
    for (const p of products) {
      if (isPhysical(p.deliveryType)) expect(p.startingPriceCents, p.slug).toBeGreaterThanOrEqual(7999);
    }
  });
});

describe('delivery-aware price-label wording', () => {
  it('both → shows print AND digital', () => {
    expect(priceLabelFor('both')).toBe('Print from $79.99 · Digital $9.99');
  });

  it('printed-only → flat $79.99 with no "From" range', () => {
    expect(priceLabelFor('printed')).toBe('$79.99');
  });

  it('digital-only → $9.99', () => {
    expect(priceLabelFor('digital')).toBe('$9.99');
  });

  it('every product label matches its delivery type and shows chargeable amounts', () => {
    for (const p of products) {
      expect(p.priceLabel, p.slug).toBe(priceLabelFor(p.deliveryType));
      if (p.deliveryType === 'both') {
        expect(p.priceLabel).toContain('$79.99');
        expect(p.priceLabel).toContain('$9.99');
      } else {
        // single-delivery products are a flat price — never a "From $X" range
        expect(p.priceLabel, p.slug).not.toContain('From');
      }
    }
  });
});

describe('structured-data (JSON-LD) offers are chargeable', () => {
  it('both → AggregateOffer spanning $9.99–$79.99', () => {
    const both = products.find((p) => p.deliveryType === 'both')!;
    const o = productOffer(both);
    expect(o['@type']).toBe('AggregateOffer');
    expect(o.lowPrice).toBe('9.99');
    expect(o.highPrice).toBe('79.99');
  });

  it('single-delivery → Offer at the chargeable price', () => {
    for (const p of products) {
      if (p.deliveryType === 'both') continue;
      const o = productOffer(p);
      expect(o['@type']).toBe('Offer');
      expect(o.price, p.slug).toBe(p.deliveryType === 'digital' ? '9.99' : '79.99');
    }
  });
});
