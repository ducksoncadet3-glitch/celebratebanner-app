import { describe, expect, it } from 'vitest';
import {
  ASPECT_DIMENSIONS,
  FLAGSHIP_ASSETS,
  FLAGSHIP_SLUGS,
  getFlagshipAsset,
} from './flagship-assets';
import { resolveProductImage } from './product-image';
import { getProductBySlug } from './products';

const EXPECTED: Record<string, 'landscape' | 'portrait' | 'square'> = {
  'team-banner': 'landscape',
  'senior-night-banner': 'landscape',
  'graduation-banner': 'landscape',
  'graduation-poster': 'portrait',
  'championship-banner': 'landscape',
  'coach-appreciation-banner': 'landscape',
  'game-day-graphic': 'square',
};

describe('flagship products + manifest', () => {
  it('defines exactly the seven flagship products', () => {
    expect(FLAGSHIP_SLUGS.sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it('every flagship slug exists in the catalog', () => {
    for (const slug of FLAGSHIP_SLUGS) {
      expect(getProductBySlug(slug), slug).toBeTruthy();
    }
  });

  it('every manifest entry has valid, non-empty asset paths (WebP, under /storefront/<slug>/)', () => {
    for (const a of FLAGSHIP_ASSETS) {
      expect(a.heroPath).toBe(`/storefront/${a.slug}/hero.webp`);
      expect(a.thumbnailPath).toBe(`/storefront/${a.slug}/thumbnail.webp`);
      expect(a.heroPath.length).toBeGreaterThan(0);
      expect(a.thumbnailPath.length).toBeGreaterThan(0);
      expect(a.alt.length).toBeGreaterThan(0);
    }
  });

  it('aspect-ratio metadata + dimensions are correct per product', () => {
    for (const [slug, aspect] of Object.entries(EXPECTED)) {
      const a = getFlagshipAsset(slug)!;
      expect(a.aspect).toBe(aspect);
      expect(a.heroDimensions).toEqual(ASPECT_DIMENSIONS[aspect].hero);
      expect(a.thumbnailDimensions).toEqual(ASPECT_DIMENSIONS[aspect].thumbnail);
    }
    // Spot-check the exact recommended dimensions.
    expect(getFlagshipAsset('team-banner')!.heroDimensions).toEqual({ width: 1600, height: 900 });
    expect(getFlagshipAsset('graduation-poster')!.heroDimensions).toEqual({ width: 1200, height: 1500 });
    expect(getFlagshipAsset('game-day-graphic')!.heroDimensions).toEqual({ width: 1200, height: 1200 });
    expect(getFlagshipAsset('team-banner')!.thumbnailDimensions).toEqual({ width: 800, height: 450 });
    expect(getFlagshipAsset('graduation-poster')!.thumbnailDimensions).toEqual({ width: 640, height: 800 });
    expect(getFlagshipAsset('game-day-graphic')!.thumbnailDimensions).toEqual({ width: 800, height: 800 });
  });
});

describe('image resolver — fallback', () => {
  it('falls back to the catalog placeholder when the file is missing', () => {
    for (const slug of FLAGSHIP_SLUGS) {
      const r = resolveProductImage(slug, 'hero', { exists: () => false });
      expect(r.isPlaceholder).toBe(true);
      expect(r.src).toBe(getProductBySlug(slug)!.image); // catalog is the source of truth
      expect(r.src.startsWith('data:image/svg+xml,')).toBe(true);
      expect(r.alt).toContain('sample design placeholder');
    }
  });

  it('with the real filesystem (no files present yet), all seven still resolve to placeholders', () => {
    for (const slug of FLAGSHIP_SLUGS) {
      const r = resolveProductImage(slug, 'hero'); // default fs check
      expect(r.isPlaceholder).toBe(true);
      expect(r.src.length).toBeGreaterThan(0);
    }
  });
});

describe('image resolver — approved asset preferred', () => {
  it('prefers the approved asset path when the file is present', () => {
    for (const slug of FLAGSHIP_SLUGS) {
      const a = getFlagshipAsset(slug)!;
      const hero = resolveProductImage(slug, 'hero', { exists: () => true });
      expect(hero.isPlaceholder).toBe(false);
      expect(hero.src).toBe(a.heroPath);
      expect(hero.alt).toBe(a.alt);
      expect(hero).toMatchObject(a.heroDimensions);

      const thumb = resolveProductImage(slug, 'thumbnail', { exists: () => true });
      expect(thumb.src).toBe(a.thumbnailPath);
      expect(thumb).toMatchObject(a.thumbnailDimensions);
    }
  });

  it('only prefers the asset for the exact requested variant', () => {
    // hero present, thumbnail missing → hero real, thumbnail placeholder
    const heroOnly = (p: string) => p.endsWith('hero.webp');
    const hero = resolveProductImage('team-banner', 'hero', { exists: heroOnly });
    const thumb = resolveProductImage('team-banner', 'thumbnail', { exists: heroOnly });
    expect(hero.isPlaceholder).toBe(false);
    expect(thumb.isPlaceholder).toBe(true);
  });
});

describe('image resolver — never empty / never broken', () => {
  it('no flagship product resolves to an empty image path (either variant, present or missing)', () => {
    for (const slug of FLAGSHIP_SLUGS) {
      for (const variant of ['hero', 'thumbnail'] as const) {
        for (const exists of [() => true, () => false]) {
          const r = resolveProductImage(slug, variant, { exists });
          expect(r.src.length, `${slug}/${variant}`).toBeGreaterThan(0);
          expect(r.alt.length).toBeGreaterThan(0);
          expect(r.width).toBeGreaterThan(0);
          expect(r.height).toBeGreaterThan(0);
        }
      }
    }
  });

  it('an unknown slug degrades safely (placeholder, empty-safe, no throw)', () => {
    const r = resolveProductImage('does-not-exist', 'hero', { exists: () => false });
    expect(r.isPlaceholder).toBe(true);
    expect(() => resolveProductImage('does-not-exist')).not.toThrow();
  });
});
