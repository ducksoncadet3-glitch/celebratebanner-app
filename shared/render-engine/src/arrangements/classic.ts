import { tileToCount } from '../canvas/helpers.js';
import { wowLayoutFor, wowSupportingCount } from './wow-geometry.js';
import { photoRot } from '../canvas/rng.js';
import { drawHero3D, drawPhotoFramed } from '../frames/dispatch.js';
import type { ArrangementRenderer } from '../types.js';
import { registerArrangement } from './registry.js';

/**
 * Classic — hero centered top (cinematic 3D), even 8×5 grid below.
 * Mirrors renderClassic() from index.html.
 */
export const ClassicArrangement: ArrangementRenderer = {
  id: 'classic',
  label: 'Classic',
  minPhotos: 1,
  maxPhotos: 50,
  render({ ctx, W, H, contentTop, rng, input }, photos) {
    const margin = 40;
    const innerW = W - margin * 2;
    const supporting = photos.slice(1);

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
    const heroY = Math.max(140, contentTop);
    const heroH = 360;
    const heroBot = heroY + heroH;
    const cols = 8;
    const rows = 5;
    const gap = 6;
    const gridTop = heroBot + 8;
    const gridBot = H - 20;
    const gridH = gridBot - gridTop;
    const cellW = (innerW - gap * (cols - 1)) / cols;
    const cellH = (gridH - gap * (rows - 1)) / rows;

    const drawList = tileToCount(supporting, cols * rows);
    drawList.forEach((p, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = margin + c * (cellW + gap);
      const y = gridTop + r * (cellH + gap);
      drawPhotoFramed(ctx, input, p, x, y, cellW, cellH, {
        rotation: photoRot(rng, 1.5),
        shadow: false,
      });
    });

    drawHero3D(ctx, input, photos[0], margin, heroY, innerW, heroH);
  },
};

registerArrangement(ClassicArrangement);
