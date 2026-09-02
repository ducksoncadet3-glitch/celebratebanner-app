import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { getAllProducts } from './products';
import { proofHrefForProduct } from './proof-link';
import { COMING_SOON_SLUGS, isComingSoon, isReadyMade, isSellable } from './availability';
import { PROOF_PRODUCTS, resolveProductId } from '@/lib/proof/options';
import { PROOF_PRODUCT_MAP, mapProofToBuilder } from '@/lib/proof/mapping';
import { PRICING } from '@/lib/pricing';

const products = getAllProducts();
const WEB_ROOT = process.cwd();

/** The 16 products the render engine can actually produce today. */
const SUPPORTED_SLUGS = [
  'team-banner', 'senior-night-banner', 'team-poster',
  'coach-appreciation-banner', 'player-spotlight-banner', 'team-photo-collage',
  'graduation-banner', 'graduation-poster', 'graduation-yard-sign',
  'graduation-welcome-banner', 'graduation-memory-collage',
  'championship-banner', 'championship-poster', 'tournament-champion-banner',
  'mvp-poster', 'team-celebration-banner',
  'world-memories-photo-collage',
  'the-beauty-of-the-world', // ready-made: sellable, but never enters the builder
];

describe('unsupported social products cannot be designed or purchased', () => {
  it('every unsupported social product is Coming Soon', () => {
    const comingSoon = products.filter(isComingSoon).map((p) => p.slug);
    for (const slug of COMING_SOON_SLUGS) expect(comingSoon, slug).toContain(slug);
  });

  it('the only other Coming Soon product is ready-made art awaiting its master asset', () => {
    const extra = products
      .filter(isComingSoon)
      .filter((p) => !COMING_SOON_SLUGS.includes(p.slug));
    for (const p of extra) {
      expect(isReadyMade(p), `${p.slug} is gated for an unexpected reason`).toBe(true);
    }
  });

  it('no Coming Soon product exposes a route into proof / create / checkout', () => {
    for (const p of products.filter(isComingSoon)) {
      expect(proofHrefForProduct(p), `${p.slug} must not link into the proof flow`).toBeNull();
    }
  });

  it('no Coming Soon product can be preselected in the proof wizard', () => {
    // Their proof key must no longer resolve, so a stale/hand-typed deep link falls back to
    // "no preselection" instead of quietly seeding a banner design.
    for (const p of products.filter(isComingSoon)) {
      if (SUPPORTED_SLUGS.includes(p.slug)) continue;
      const stillSelectable = PROOF_PRODUCTS.some((o) => o.id === p.proofProductKey);
      const usedBySellable = products.some((q) => isSellable(q) && q.proofProductKey === p.proofProductKey);
      // A key may remain selectable ONLY because a sellable product also uses it.
      expect(stillSelectable && !usedBySellable, `${p.proofProductKey} is selectable but no sellable product uses it`).toBe(false);
    }
  });

  it('the retired social proof key resolves to null and maps to no builder theme', () => {
    expect(resolveProductId('football-social-graphics')).toBeNull();
    expect(PROOF_PRODUCT_MAP['football-social-graphics']).toBeUndefined();
    expect(mapProofToBuilder({
      productId: 'football-social-graphics',
      team: { teamName: 'Riverside Eagles', email: '', name: '', phone: '' },
    } as never)).toEqual({});
  });
});

describe('supported products remain sellable', () => {
  it('every supported product is sellable and deep-links into the proof flow', () => {
    const sellable = products.filter(isSellable).map((p) => p.slug).sort();
    expect(sellable).toEqual([...SUPPORTED_SLUGS].sort());
    for (const p of products.filter(isSellable)) {
      if (isReadyMade(p)) {
        expect(proofHrefForProduct(p), `${p.slug} is ready-made`).toBeNull();
        continue;
      }
      expect(proofHrefForProduct(p)).toBe(`/proof?product=${p.proofProductKey}`);
    }
  });

  it('every sellable PERSONALIZED product maps to a real builder configuration', () => {
    // Ready-made products have no builder configuration by design.
    for (const p of products.filter(isSellable).filter((x) => !isReadyMade(x))) {
      expect(PROOF_PRODUCT_MAP[p.proofProductKey], `${p.slug} → ${p.proofProductKey}`).toBeTruthy();
    }
  });

  it('pricing is unchanged: $79.99 print / $9.99 digital', () => {
    expect(PRICING.print.amountCents).toBe(7999);
    expect(PRICING.digital.amountCents).toBe(999);
  });
});

describe('builder copy and product identity', () => {
  it('the builder heading says "Design your product", never "Design your banner"', () => {
    for (const f of ['app/create/page.tsx', 'components/create-flow.tsx']) {
      const body = readFileSync(path.join(WEB_ROOT, f), 'utf8');
      expect(body, `${f} still says "Design your banner"`).not.toContain('Design your banner');
    }
    expect(readFileSync(path.join(WEB_ROOT, 'app/create/page.tsx'), 'utf8'))
      .toContain('Design your product');
  });

  it('the builder surfaces the selected product instead of re-asking for a theme', () => {
    const body = readFileSync(path.join(WEB_ROOT, 'components/create-flow.tsx'), 'utf8');
    expect(body).toContain('productLabel');
    expect(body).toContain("You&apos;re designing");
  });

  it('a supported product still produces a builder prefill (proof-first flow intact)', () => {
    const prefill = mapProofToBuilder({
      productId: 'team-roster-banner',
      team: { teamName: 'Riverside Eagles', email: '', name: '', phone: '' },
    } as never);
    expect(prefill.themeId).toBe('champion');
    expect(prefill.text).toEqual({ teamName: 'Riverside Eagles' });
  });
});
