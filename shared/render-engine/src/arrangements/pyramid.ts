import { supportingCapacity } from './adaptive-geometry.js';
import { wowLayoutFor, wowSupportingCount } from './wow-geometry.js';
import { photoRot } from '../canvas/rng.js';
import { drawHero3D, drawPhotoFramed } from '../frames/dispatch.js';
import type { ArrangementRenderer } from '../types.js';
import { registerArrangement } from './registry.js';

/**
 * Pyramid — hero centered top, widening rows of supporting photos below.
 * Rows are 2, 3, 4, 5, 6, 7, ... — extend until all photos are placed.
 *
 * This arrangement was already adaptive and its composition is deliberately preserved.
 * The only corrections are the two the diagnostics found: the documented 28-photo
 * maximum is now actually enforced, and the cell size can no longer exceed its row
 * height (the old `max(28, …)` floor could push the lowest rows off the canvas when a
 * long headline pushed `contentTop` down).
 */
export const PyramidArrangement: ArrangementRenderer = {
  id: 'pyramid',
  label: 'Pyramid',
  minPhotos: 3,
  maxPhotos: 28,
  render({ ctx, W, H, contentTop, rng, input }, photos) {
    const margin = 40;
    const innerW = W - margin * 2;
    const innerH = H - contentTop - 60;
    // The advertised maximum is TOTAL photos, hero included — clamp here, once.
    const supporting = photos.slice(1, 1 + supportingCapacity('pyramid'));

    // ── WOW mode: intentional geometry, never a repeated photo ──────────────
    if (input.renderMode === 'wow' && photos.length > 0) {
      try {
        const n = wowSupportingCount('pyramid', supporting.length);
        const L = wowLayoutFor('pyramid', W, H, contentTop, n);
        for (let i = 0; i < n; i++) {
          const c = L.cells[i];
          drawPhotoFramed(ctx, input, supporting[i], c.x, c.y, c.w, c.h, { rotation: photoRot(rng, 2.5), shadow: false });
        }
        drawHero3D(ctx, input, photos[0], L.hero.x, L.hero.y, L.hero.w, L.hero.h);
        return;
      } catch {
        // Degenerate geometry → fall through to the standard renderer below.
      }
    }

    const heroSize = Math.min(innerW * 0.45, innerH * 0.40);
    const heroX = (W - heroSize) / 2;
    const heroY = contentTop + 8;
    const heroBot = heroY + heroSize + 32;

    // Build widening rows (2, 3, 4, …) until every photo is placed.
    const rowCounts: number[] = [];
    let remaining = supporting.length;
    let rowCols = 2;
    while (remaining > 0) {
      const take = Math.min(rowCols, remaining);
      rowCounts.push(take);
      remaining -= take;
      rowCols++;
    }
    if (rowCounts.length === 0) rowCounts.push(0);

    const pyTop = heroBot;
    const pyBottom = H - 50;
    const pyH = Math.max(60, pyBottom - pyTop);
    const rowH = pyH / rowCounts.length;
    const widestRow = Math.max(...rowCounts);
    const maxCellByWidth = (innerW - 10 * (widestRow - 1)) / Math.max(1, widestRow);
    // Three constraints, all of which the old `max(28, …)` floor could violate:
    //   • never wider than its share of the row,
    //   • never taller than its own row (or the lowest rows walk off the canvas),
    //   • never rivalling the hero — at low counts a single supporting photo used to
    //     render LARGER than the hero. 0.42 matches the WOW pyramid's cap.
    const cellSize = Math.min(
      Math.max(12, Math.min(rowH * 0.85, maxCellByWidth)),
      rowH,
      heroSize * 0.42,
    );

    let idx = 0;
    rowCounts.forEach((count, r) => {
      if (count === 0) return;
      const totalW = count * cellSize + (count - 1) * 10;
      let xCursor = (W - totalW) / 2;
      const yTop = pyTop + r * rowH + (rowH - cellSize) / 2;
      for (let c = 0; c < count; c++) {
        drawPhotoFramed(ctx, input, supporting[idx], 0, 0, cellSize, cellSize, {
          cx: xCursor + cellSize / 2,
          cy: yTop + cellSize / 2,
          rotation: photoRot(rng, 2.5),
          shadow: false,
        });
        idx++;
        xCursor += cellSize + 10;
      }
    });

    drawHero3D(ctx, input, photos[0], heroX, heroY, heroSize, heroSize);
  },
};

registerArrangement(PyramidArrangement);
