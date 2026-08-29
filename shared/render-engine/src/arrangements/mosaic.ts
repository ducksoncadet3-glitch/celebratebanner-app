import { adaptiveLayoutFor, supportingCapacity, supportingCount } from './adaptive-geometry.js';
import { wowLayoutFor, wowSupportingCount } from './wow-geometry.js';
import { photoRot } from '../canvas/rng.js';
import { drawHero3D, drawPhotoFramed } from '../frames/dispatch.js';
import type { ArrangementRenderer } from '../types.js';
import { registerArrangement } from './registry.js';

/**
 * Mosaic — hero at the centre of a woven frame: a band above, a rail down each side,
 * a band below. Photos are split between the regions in proportion to the area each
 * offers, so the weave thickens with the count instead of leaving empty slots.
 */
export const MosaicArrangement: ArrangementRenderer = {
  id: 'mosaic',
  label: 'Mosaic',
  minPhotos: 8,
  maxPhotos: 40,
  render({ ctx, W, H, contentTop, rng, input }, photos) {
    // The advertised maximum is TOTAL photos, hero included — clamp here, once.
    const supporting = photos.slice(1, 1 + supportingCapacity('mosaic'));

    // ── WOW mode: intentional geometry, never a repeated photo ──────────────
    if (input.renderMode === 'wow' && photos.length > 0) {
      try {
        const n = wowSupportingCount('mosaic', supporting.length);
        const L = wowLayoutFor('mosaic', W, H, contentTop, n);
        for (let i = 0; i < n; i++) {
          const c = L.cells[i];
          drawPhotoFramed(ctx, input, supporting[i], c.x, c.y, c.w, c.h, { rotation: photoRot(rng, 0.5), shadow: false });
        }
        drawHero3D(ctx, input, photos[0], L.hero.x, L.hero.y, L.hero.w, L.hero.h);
        return;
      } catch {
        // Degenerate geometry → fall through to the standard renderer below.
      }
    }

    const n = supportingCount('mosaic', supporting.length);
    const L = adaptiveLayoutFor('mosaic', W, H, contentTop, n, rng);
    for (let i = 0; i < n; i++) {
      const c = L.cells[i];
      drawPhotoFramed(ctx, input, supporting[i], c.x, c.y, c.w, c.h, {
        rotation: photoRot(rng, 0.5),
        shadow: false,
      });
    }
    drawHero3D(ctx, input, photos[0], L.hero.x, L.hero.y, L.hero.w, L.hero.h);
  },
};

registerArrangement(MosaicArrangement);
