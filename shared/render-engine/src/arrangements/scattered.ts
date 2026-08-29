import { adaptiveLayoutFor, supportingCapacity, supportingCount } from './adaptive-geometry.js';
import { drawHero3D, drawPhoto3D } from '../frames/dispatch.js';
import type { ArrangementRenderer } from '../types.js';
import { registerArrangement } from './registry.js';

/**
 * Scattered — scrapbook feel. Photos settle into free cells around a central hero,
 * ring by ring, on a grid sized to the actual count: few photos read large, many read
 * small, and none is ever repeated to fill a pin-board slot.
 *
 * Positions and rotations come from the seeded PRNG, so the same seed always produces
 * the same board.
 */
export const ScatteredArrangement: ArrangementRenderer = {
  id: 'scattered',
  label: 'Scattered',
  minPhotos: 5,
  maxPhotos: 40,
  render({ ctx, W, H, contentTop, rng, input }, photos) {
    // The advertised maximum is TOTAL photos, hero included — clamp here, once.
    const supporting = photos.slice(1, 1 + supportingCapacity('scattered'));

    const n = supportingCount('scattered', supporting.length);
    const L = adaptiveLayoutFor('scattered', W, H, contentTop, n, rng);
    for (let i = 0; i < n; i++) {
      const c = L.cells[i];
      const rot = (rng() * 14 - 7) * (Math.PI / 180);
      drawPhoto3D(
        ctx, input, supporting[i],
        c.x + c.w / 2, c.y + c.h / 2, c.w, c.h,
        rot, 8 + rng() * 14, 18 + rng() * 16,
      );
    }
    drawHero3D(ctx, input, photos[0], L.hero.x, L.hero.y, L.hero.w, L.hero.h);
  },
};

registerArrangement(ScatteredArrangement);
