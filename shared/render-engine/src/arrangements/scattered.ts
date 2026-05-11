import { tileToCount } from '../canvas/helpers.js';
import { drawHero3D, drawPhoto3D } from '../frames/dispatch.js';
import type { ArrangementRenderer } from '../types.js';
import { registerArrangement } from './registry.js';

/**
 * Scattered — scrapbook feel. Fixed positions around a center hero, each tile
 * has a ±7° rotation and varying shadow blur. Mirrors renderScattered().
 */
export const ScatteredArrangement: ArrangementRenderer = {
  id: 'scattered',
  label: 'Scattered',
  minPhotos: 5,
  maxPhotos: 40,
  render({ ctx, W, H, contentTop, rng, input }, photos) {
    const supporting = photos.slice(1);
    const tileSize = 130;
    const safeTop = contentTop + 20;
    const contentBottom = H - 60;
    const contentH = contentBottom - safeTop;
    const heroW = 340;
    const heroH = 380;
    const heroX = (W - heroW) / 2;
    const heroY = safeTop + (contentH - heroH) / 2;

    // Fixed base positions tuned for visual balance — corners + flank columns.
    const basePositions: [number, number][] = [
      [60, safeTop + 20], [180, safeTop + 40], [60, safeTop + 155], [175, safeTop + 170],
      [470, safeTop + 20], [590, safeTop + 40], [475, safeTop + 155], [590, safeTop + 170],
      [55, safeTop + 720], [175, safeTop + 700], [60, safeTop + 840], [180, safeTop + 855],
      [470, safeTop + 720], [590, safeTop + 700], [475, safeTop + 840], [590, safeTop + 855],
    ];

    const drawList = tileToCount(supporting, basePositions.length);
    drawList.forEach((p, i) => {
      const [bx, by] = basePositions[i];
      const cx = bx + tileSize / 2;
      const cy = by + tileSize / 2;
      const rot = (rng() * 14 - 7) * (Math.PI / 180);
      drawPhoto3D(ctx, input, p, cx, cy, tileSize, tileSize, rot, 8 + rng() * 14, 18 + rng() * 16);
    });

    drawHero3D(ctx, input, photos[0], heroX, heroY, heroW, heroH);
  },
};

registerArrangement(ScatteredArrangement);
