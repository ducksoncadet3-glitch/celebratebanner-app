import { mulberry32 } from '../canvas/rng.js';
import { getArrangement } from '../arrangements/index.js';
import { drawBannerBackground } from '../theme/background.js';
import { renderBannerText } from '../theme/text.js';
import type { Photo, RenderContext, RenderEnv, RenderInput } from '../types.js';

// Importing these for their side effects: it populates the registries.
// Pipeline consumers don't have to remember to import them separately.
import '../frames/index.js';
import '../arrangements/index.js';
import '../mockups/index.js';

/**
 * Core renderer. Composes background → text → arrangement → text (re-stamped
 * for safety) onto the supplied 2D context. Logical coordinate space is taken
 * from `input.width` × `input.height`; the caller is responsible for any DPR
 * scaling before invoking.
 *
 * Pure function: same input → same pixels. Safe to call on the browser canvas
 * or a node-canvas/skia-canvas in a worker.
 */
export function renderBanner(ctx: RenderContext, input: RenderInput): void {
  const { width: W, height: H, theme, bannerText, arrangement, photos, heroId } = input;

  // 1. Background + gold border
  drawBannerBackground(ctx, W, H, theme.palette);

  // 2. Banner text (returns Y of last text line)
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  const textBottomY = renderBannerText(ctx, W, 56, theme, bannerText);
  ctx.restore();

  if (photos.length === 0) return;

  // 3. Reorder photos so hero is photos[0] (engine contract)
  const heroIdx = heroId ? photos.findIndex((p) => p.id === heroId) : 0;
  const orderedPhotos: Photo[] =
    heroIdx > 0
      ? [photos[heroIdx], ...photos.slice(0, heroIdx), ...photos.slice(heroIdx + 1)]
      : photos;

  // 4. Arrangement
  const contentTop = textBottomY + 24;
  const seed = (input.seed ?? 12345) >>> 0;
  const rng = mulberry32(seed ^ 0xa11c);
  const env: RenderEnv = { ctx, W, H, contentTop, rng, input };
  const arr = getArrangement(arrangement);
  arr.render(env, orderedPhotos);

  // 5. Re-stamp the text on top so the hero photo never occludes the headline.
  // This matches index.html which calls renderBannerText twice on purpose.
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  renderBannerText(ctx, W, 56, theme, bannerText);
  ctx.restore();
}
