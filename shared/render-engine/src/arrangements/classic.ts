import { adaptiveLayoutFor, supportingCapacity, supportingCount } from './adaptive-geometry.js';
import { wowLayoutFor, wowSupportingCount } from './wow-geometry.js';
import { photoRot } from '../canvas/rng.js';
import { drawHero3D, drawPhotoFramed } from '../frames/dispatch.js';
import type { ArrangementRenderer } from '../types.js';
import { registerArrangement } from './registry.js';

/**
 * Classic — a commanding hero above one balanced grid of every remaining photo.
 * Rows and columns are derived from the actual upload, so nothing is repeated to
 * fill a slot and nothing in range is left out.
 */
export const ClassicArrangement: ArrangementRenderer = {
  id: 'classic',
  label: 'Classic',
  minPhotos: 1,
  maxPhotos: 50,
  render({ ctx, W, H, contentTop, rng, input }, photos) {
    // The advertised maximum is TOTAL photos, hero included — clamp here, once.
    const supporting = photos.slice(1, 1 + supportingCapacity('classic'));

    // ── WOW mode: intentional geometry, never a repeated photo ──────────────
    if (input.renderMode === 'wow' && photos.length > 0) {
      try {
        const n = wowSupportingCount('classic', supporting.length);
        const L = wowLayoutFor('classic', W, H, contentTop, n);
        for (let i = 0; i < n; i++) {
          const c = L.cells[i];
          drawPhotoFramed(ctx, input, supporting[i], c.x, c.y, c.w, c.h, { rotation: photoRot(rng, 1.5), shadow: false });
        }
        drawHero3D(ctx, input, photos[0], L.hero.x, L.hero.y, L.hero.w, L.hero.h);
        return;
      } catch {
        // Degenerate geometry → fall through to the standard renderer below.
      }
    }

    const n = supportingCount('classic', supporting.length);
    const L = adaptiveLayoutFor('classic', W, H, contentTop, n, rng);
    for (let i = 0; i < n; i++) {
      const c = L.cells[i];
      drawPhotoFramed(ctx, input, supporting[i], c.x, c.y, c.w, c.h, {
        rotation: photoRot(rng, 1.5),
        shadow: false,
      });
    }
    drawHero3D(ctx, input, photos[0], L.hero.x, L.hero.y, L.hero.w, L.hero.h);
  },
};

registerArrangement(ClassicArrangement);
