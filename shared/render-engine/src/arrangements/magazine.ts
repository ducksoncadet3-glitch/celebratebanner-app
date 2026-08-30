import { adaptiveLayoutFor, supportingCapacity, supportingCount } from './adaptive-geometry.js';
import { wowLayoutFor, wowSupportingCount } from './wow-geometry.js';
import { photoRot } from '../canvas/rng.js';
import { drawHero3D, drawPhotoFramed } from '../frames/dispatch.js';
import type { ArrangementRenderer } from '../types.js';
import { registerArrangement } from './registry.js';

/**
 * Magazine — an editorial hero with a supporting rail beside it, and a grid below once
 * the rail is full. Blocks are sized from the real photo count, so a three-photo banner
 * is composed negative space rather than twenty-one repeats.
 */
export const MagazineArrangement: ArrangementRenderer = {
  id: 'magazine',
  label: 'Magazine',
  minPhotos: 3,
  maxPhotos: 25,
  render({ ctx, W, H, contentTop, rng, input }, photos) {
    // The advertised maximum is TOTAL photos, hero included — clamp here, once.
    const supporting = photos.slice(1, 1 + supportingCapacity('magazine'));

    // ── WOW mode: intentional geometry, never a repeated photo ──────────────
    if (input.renderMode === 'wow' && photos.length > 0) {
      try {
        const n = wowSupportingCount('magazine', supporting.length);
        const L = wowLayoutFor('magazine', W, H, contentTop, n);
        for (let i = 0; i < n; i++) {
          const c = L.cells[i];
          drawPhotoFramed(ctx, input, supporting[i], c.x, c.y, c.w, c.h, { rotation: photoRot(rng, 1), shadow: false });
        }
        drawHero3D(ctx, input, photos[0], L.hero.x, L.hero.y, L.hero.w, L.hero.h);
        return;
      } catch {
        // Degenerate geometry → fall through to the standard renderer below.
      }
    }

    // Looping over the PHOTO count (not a fixed slot count) is also what makes a
    // hero-only upload safe: the old fixed loops indexed past the end and threw.
    const n = supportingCount('magazine', supporting.length);
    const L = adaptiveLayoutFor('magazine', W, H, contentTop, n, rng);
    for (let i = 0; i < n; i++) {
      const c = L.cells[i];
      drawPhotoFramed(ctx, input, supporting[i], c.x, c.y, c.w, c.h, {
        rotation: photoRot(rng, 1),
        shadow: false,
      });
    }
    drawHero3D(ctx, input, photos[0], L.hero.x, L.hero.y, L.hero.w, L.hero.h);
  },
};

registerArrangement(MagazineArrangement);
