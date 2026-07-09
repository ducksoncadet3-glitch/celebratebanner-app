import { tileToCount } from '../canvas/helpers.js';
import { wowLayoutFor, wowSupportingCount } from './wow-geometry.js';
import { photoRot } from '../canvas/rng.js';
import { drawHero3D, drawPhotoFramed } from '../frames/dispatch.js';
import type { ArrangementRenderer } from '../types.js';
import { registerArrangement } from './registry.js';

/**
 * Magazine — hero left, 2-col right grid alongside, 3-col grid below hero.
 * Mirrors renderMagazine() from index.html.
 */
export const MagazineArrangement: ArrangementRenderer = {
  id: 'magazine',
  label: 'Magazine',
  minPhotos: 3,
  maxPhotos: 25,
  render({ ctx, W, H, contentTop, rng, input }, photos) {
    const supporting = photos.slice(1);
    const gap = 8;

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

    const heroX = 40;
    const heroY = Math.max(128, contentTop);
    const heroW = 460;
    const heroH = 420;

    const leftBelowY = heroY + heroH + gap;
    const leftBelowH = 1170 - leftBelowY;
    const leftCols = 3;
    const leftRows = 4;
    const leftCellW = (460 - gap * (leftCols - 1)) / leftCols;
    const leftCellH = (leftBelowH - gap * (leftRows - 1)) / leftRows;

    const rightX = 508;
    const rightY = heroY;
    const rightW = 252;
    const rightH = 1170 - rightY;
    const rightCols = 2;
    const rightRows = 6;
    const rightCellW = (rightW - gap * (rightCols - 1)) / rightCols;
    const rightCellH = (rightH - gap * (rightRows - 1)) / rightRows;

    const total = leftCols * leftRows + rightCols * rightRows;
    const drawList = tileToCount(supporting, total);

    for (let i = 0; i < rightCols * rightRows; i++) {
      const p = drawList[i];
      const r = Math.floor(i / rightCols);
      const c = i % rightCols;
      drawPhotoFramed(
        ctx, input, p,
        rightX + c * (rightCellW + gap),
        rightY + r * (rightCellH + gap),
        rightCellW, rightCellH,
        { rotation: photoRot(rng, 1), shadow: false },
      );
    }
    for (let i = 0; i < leftCols * leftRows; i++) {
      const p = drawList[rightCols * rightRows + i];
      const r = Math.floor(i / leftCols);
      const c = i % leftCols;
      drawPhotoFramed(
        ctx, input, p,
        40 + c * (leftCellW + gap),
        leftBelowY + r * (leftCellH + gap),
        leftCellW, leftCellH,
        { rotation: photoRot(rng, 1), shadow: false },
      );
    }

    drawHero3D(ctx, input, photos[0], heroX, heroY, heroW, heroH);
  },
};

registerArrangement(MagazineArrangement);
