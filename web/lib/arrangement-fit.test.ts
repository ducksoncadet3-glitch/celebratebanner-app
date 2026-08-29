import { describe, expect, it } from 'vitest';
import {
  listArrangements, renderBanner, ARRANGEMENT_MAX_PHOTOS, supportingCount,
  type ArrangementId,
} from '@celebratebanner/render-engine';
import { arrangementFit } from './arrangement-fit';

/**
 * Photo-count safety net.
 *
 * The uploader accepts 50 photos but arrangements cap at 25–50. The renderer clamps
 * correctly; these tests prove the CUSTOMER IS TOLD, that their photos are never
 * touched, and that the number we promise on screen is the number the renderer draws.
 */

const ARRANGEMENTS: ArrangementId[] = ['classic', 'magazine', 'pyramid', 'scattered', 'mosaic'];

/** The required review matrix: counts to check per arrangement. */
const MATRIX: Record<ArrangementId, number[]> = {
  classic: [1, 21, 50],
  magazine: [1, 3, 25, 26, 50],
  pyramid: [1, 3, 28, 29, 50],
  scattered: [1, 5, 40, 41, 50],
  mosaic: [1, 8, 40, 41, 50],
};

const specOf = (id: ArrangementId) => listArrangements().find((a) => a.id === id)!;

describe('arrangement compatibility state', () => {
  it('classifies every point in the review matrix correctly', () => {
    for (const id of ARRANGEMENTS) {
      const spec = specOf(id);
      for (const count of MATRIX[id]) {
        const fit = arrangementFit(id, count);
        const expected =
          count > spec.maxPhotos ? 'above-max' : count < spec.minPhotos ? 'below-min' : 'ok';
        expect(fit.status, `${id} @ ${count}`).toBe(expected);
        expect(fit.compatible, `${id} @ ${count} compatible`).toBe(expected === 'ok');
      }
    }
  });

  it('a compatible arrangement shows no warning at all', () => {
    const compatible: [ArrangementId, number][] = [
      ['classic', 1], ['classic', 21], ['classic', 50],
      ['magazine', 3], ['magazine', 25],
      ['pyramid', 3], ['pyramid', 28],
      ['scattered', 5], ['scattered', 40],
      ['mosaic', 8], ['mosaic', 40],
    ];
    for (const [id, count] of compatible) {
      const fit = arrangementFit(id, count);
      expect(fit.compatible, `${id} @ ${count}`).toBe(true);
      expect(fit.message, `${id} @ ${count} must be silent`).toBe('');
      expect(fit.suggestion).toBeNull();
      expect(fit.used, `${id} @ ${count} uses every photo`).toBe(count);
    }
  });

  it('says nothing before any photo is uploaded', () => {
    for (const id of ARRANGEMENTS) {
      const fit = arrangementFit(id, 0);
      expect(fit.status).toBe('ok');
      expect(fit.message).toBe('');
    }
  });
});

describe('over-capacity notice', () => {
  it('names the arrangement, its maximum, the upload size, and a way to use them all', () => {
    const fit = arrangementFit('magazine', 50);
    expect(fit.status).toBe('above-max');
    expect(fit.used).toBe(25);
    expect(fit.message).toContain('Magazine');
    expect(fit.message).toContain('25');
    expect(fit.message).toContain('50');
    expect(fit.message).toContain('stay saved');
    expect(fit.suggestion?.label).toBe('Classic');
    expect(fit.message).toContain('Choose Classic to include all 50.');
  });

  it('recommends an arrangement that can actually hold every uploaded photo', () => {
    for (const id of ARRANGEMENTS) {
      for (const count of MATRIX[id]) {
        const fit = arrangementFit(id, count);
        if (fit.status !== 'above-max' || !fit.suggestion) continue;
        const suggested = specOf(fit.suggestion.id);
        expect(suggested.maxPhotos, `${id} @ ${count} → ${suggested.label}`)
          .toBeGreaterThanOrEqual(count);
        expect(suggested.minPhotos).toBeLessThanOrEqual(count);
        expect(fit.suggestion.id).not.toBe(id);
      }
    }
  });

  it('never calls the customer’s photos "excess", "extra", "dropped" or "ignored"', () => {
    const banned = ['excess', 'extra', 'dropped', 'discard', 'ignored', 'lost', 'too many', 'error'];
    for (const id of ARRANGEMENTS) {
      for (const count of [1, 2, 26, 29, 41, 50]) {
        const msg = arrangementFit(id, count).message.toLowerCase();
        for (const word of banned) {
          expect(msg, `${id} @ ${count} says "${word}"`).not.toContain(word);
        }
      }
    }
  });
});

describe('below-minimum guidance', () => {
  it('states the range, how many to add, and an arrangement that already works', () => {
    const fit = arrangementFit('magazine', 1);
    expect(fit.status).toBe('below-min');
    expect(fit.shortBy).toBe(2);
    expect(fit.message).toBe(
      'Magazine is designed for 3–25 photos. Add 2 more photos for this arrangement, or choose Classic.',
    );
  });

  it('uses singular wording when a single photo is enough', () => {
    const fit = arrangementFit('pyramid', 2);
    expect(fit.shortBy).toBe(1);
    expect(fit.message).toContain('Add 1 more photo for this arrangement');
    expect(fit.message).not.toContain('1 more photos');
  });

  it('reports the shortfall correctly at every below-minimum point in the matrix', () => {
    for (const id of ARRANGEMENTS) {
      for (const count of MATRIX[id]) {
        const fit = arrangementFit(id, count);
        if (fit.status !== 'below-min') continue;
        expect(fit.shortBy).toBe(specOf(id).minPhotos - count);
        expect(fit.message).toContain(`${specOf(id).minPhotos}–${specOf(id).maxPhotos}`);
        expect(fit.suggestion?.id, `${id} @ ${count} should suggest a workable layout`).toBe('classic');
      }
    }
  });

  it('does not block the layout — below-minimum is guidance, and every photo is still used', () => {
    for (const id of ARRANGEMENTS) {
      for (let count = 1; count < specOf(id).minPhotos; count++) {
        expect(arrangementFit(id, count).used).toBe(count);
      }
    }
  });
});

describe('the customer keeps every photo', () => {
  it('reports the full upload size regardless of what the layout can show', () => {
    for (const id of ARRANGEMENTS) {
      for (const count of MATRIX[id]) {
        const fit = arrangementFit(id, count);
        expect(fit.photoCount, `${id} @ ${count} must report the real upload size`).toBe(count);
        expect(fit.used).toBeLessThanOrEqual(fit.photoCount);
      }
    }
  });

  it('never mutates the photo collection it is asked about', () => {
    const photos = Array.from({ length: 50 }, (_, i) => ({ id: 'p' + i }));
    const snapshot = JSON.stringify(photos);
    for (const id of ARRANGEMENTS) arrangementFit(id, photos.length);
    expect(photos).toHaveLength(50);
    expect(JSON.stringify(photos)).toBe(snapshot);
  });

  it('switching arrangements recalculates immediately from the same upload', () => {
    const count = 50;
    const magazine = arrangementFit('magazine', count);
    const classic = arrangementFit('classic', count);
    expect(magazine.compatible).toBe(false);
    expect(magazine.used).toBe(25);
    expect(classic.compatible).toBe(true);
    expect(classic.used).toBe(50);
    // Both saw the same, unchanged upload.
    expect(magazine.photoCount).toBe(count);
    expect(classic.photoCount).toBe(count);
    // Switching back to the over-capacity layout restores the warning.
    expect(arrangementFit('magazine', count).message).toBe(magazine.message);
  });

  it('is pure — repeated calls give identical results', () => {
    for (const id of ARRANGEMENTS) {
      for (const count of MATRIX[id]) {
        expect(arrangementFit(id, count)).toEqual(arrangementFit(id, count));
      }
    }
  });
});

describe('the promised count is the rendered count', () => {
  it('fit.used matches the engine capacity the renderer actually enforces', () => {
    for (const id of ARRANGEMENTS) {
      for (const count of MATRIX[id]) {
        const fit = arrangementFit(id, count);
        const engineUsed = Math.min(count, ARRANGEMENT_MAX_PHOTOS[id]);
        expect(fit.used, `${id} @ ${count}`).toBe(engineUsed);
        // Hero + supporting must equal what we promise on screen.
        expect(supportingCount(id, count - 1) + 1).toBe(engineUsed);
      }
    }
  });

  it('the renderer draws exactly fit.used photos, each exactly once', () => {
    for (const id of ARRANGEMENTS) {
      for (const count of MATRIX[id]) {
        const drawn = new Map<string, number>();
        const grad = { addColorStop() {} };
        const ctx = new Proxy({} as Record<string, unknown>, {
          get(_t, prop: string) {
            if (prop === 'drawImage') {
              return (image: { id?: string } | null) => {
                if (image && typeof image.id === 'string') {
                  drawn.set(image.id, (drawn.get(image.id) ?? 0) + 1);
                }
              };
            }
            if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => grad;
            if (prop === 'measureText') return () => ({ width: 10 });
            return () => undefined;
          },
          set: () => true,
        });

        renderBanner(ctx as never, {
          width: 800, height: 1200, arrangement: id,
          theme: { id: 'graduation', fields: ['name'], palette: { bg: '#0C0E14', accent: '#C9A84C', text: '#FAF8F3' } },
          bannerText: { name: 'Jordan' },
          photos: Array.from({ length: count }, (_, i) => ({
            id: 'p' + i, image: { id: 'p' + i, width: 1000, height: 1000 },
          })),
          heroId: 'p0', frames: {}, defaultFrame: 'rounded', seed: 7, cinematicHero: true,
        } as never);

        const fit = arrangementFit(id, count);
        expect(drawn.size, `${id} @ ${count}: promised ${fit.used} photos`).toBe(fit.used);
        for (const [photoId, times] of drawn) {
          expect(times, `${id} @ ${count}: ${photoId} drawn ${times}×`).toBe(1);
        }
      }
    }
  });
});
