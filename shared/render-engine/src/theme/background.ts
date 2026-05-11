import { lightenHex } from '../canvas/helpers.js';
import type { Palette, RenderContext } from '../types.js';

/**
 * Draws the banner background: vertical gradient + accent stroke border.
 * This is the FIRST thing painted on the canvas, before text and photos.
 */
export function drawBannerBackground(
  ctx: RenderContext,
  W: number,
  H: number,
  palette: Palette,
): void {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, lightenHex(palette.bg, 12));
  grad.addColorStop(1, palette.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, W - 40, H - 40);
}
