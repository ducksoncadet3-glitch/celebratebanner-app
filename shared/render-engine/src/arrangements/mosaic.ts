import { tileToCount } from '../canvas/helpers.js';
import { wowLayoutFor, wowSupportingCount } from './wow-geometry.js';
import { photoRot } from '../canvas/rng.js';
import { drawHero3D, drawPhotoFramed } from '../frames/dispatch.js';
import type { ArrangementRenderer } from '../types.js';
import { registerArrangement } from './registry.js';

/**
 * Mosaic — hero center, 5-slot top row, 3-row side columns, 3-row bottom band.
 * Mirrors renderMosaic() from index.html.
 */
export const MosaicArrangement: ArrangementRenderer = {
  id: 'mosaic',
  label: 'Mosaic',
  minPhotos: 8,
  maxPhotos: 40,
  render({ ctx, W, H, contentTop, rng, input }, photos) {
    const supporting = photos.slice(1);
    const margin = 40;

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
    const gap = 8;
    const contentBottom = H - margin;

    const heroW = 320;
    const heroH = 380;
    const heroX = (W - heroW) / 2;
    const heroY = contentTop + Math.floor((contentBottom - contentTop) * 0.22);

    const topH = heroY - gap - contentTop;
    const topW = (720 - 4 * gap) / 5;
    const topXs = [40, 184, 328, 472, 616];

    const sideRows = 3;
    const sideW = 192;
    const sideH = (heroH - gap * (sideRows - 1)) / sideRows;

    const botTop = heroY + heroH + gap;
    const botBandH = contentBottom - botTop;
    const botRows = 3;
    const botRowH = (botBandH - gap * (botRows - 1)) / botRows;

    const slots: { x: number; y: number; w: number; h: number }[] = [];
    topXs.forEach((tx) => slots.push({ x: tx, y: contentTop, w: topW, h: topH }));
    for (let i = 0; i < sideRows; i++) {
      slots.push({ x: 40, y: heroY + i * (sideH + gap), w: sideW, h: sideH });
      slots.push({ x: W - margin - sideW, y: heroY + i * (sideH + gap), w: sideW, h: sideH });
    }
    for (let r = 0; r < botRows; r++) {
      topXs.forEach((tx) => slots.push({ x: tx, y: botTop + r * (botRowH + gap), w: topW, h: botRowH }));
    }

    const drawList = tileToCount(supporting, slots.length);
    drawList.forEach((p, i) => {
      const s = slots[i];
      drawPhotoFramed(ctx, input, p, s.x, s.y, s.w, s.h, {
        rotation: photoRot(rng, 0.5),
        shadow: false,
      });
    });

    drawHero3D(ctx, input, photos[0], heroX, heroY, heroW, heroH);
  },
};

registerArrangement(MosaicArrangement);
