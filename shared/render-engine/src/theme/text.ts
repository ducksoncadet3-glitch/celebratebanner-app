import { hexToRgba } from '../canvas/helpers.js';
import type { BannerText, RenderContext, Theme } from '../types.js';

/**
 * Render the banner headline + sub fields at the top of the canvas.
 *
 * Layout matches the existing index.html behavior:
 *   • Field 0 (headline) — 64px serif. Empty → italic placeholder in muted accent.
 *   • Field 1            — 30px italic serif, accent color. Skipped if empty.
 *   • Field 2+           — 18px sans, 78% accent. Skipped if empty.
 *
 * Returns the Y coordinate of the bottom of the rendered text, so callers can
 * place photo content directly below.
 */
export function renderBannerText(
  ctx: RenderContext,
  W: number,
  topY: number,
  theme: Theme,
  bannerText: BannerText,
): number {
  const fields = theme.fields ?? [];
  const palette = theme.palette;
  let y = topY;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  fields.forEach((key, i) => {
    const value = (bannerText[key] ?? '').trim();
    if (i === 0) {
      if (value) {
        ctx.fillStyle = palette.text;
        ctx.font = 'bold 64px "Cormorant Garamond", serif';
        ctx.fillText(value, W / 2, y + 56);
      } else {
        const meta = theme.fieldMeta?.[key];
        const placeholder = meta?.placeholder || `Your ${key}`;
        ctx.fillStyle = hexToRgba(palette.text, 0.45);
        ctx.font = 'italic 600 56px "Cormorant Garamond", serif';
        ctx.fillText(placeholder, W / 2, y + 56);
      }
      y += 74;
    } else if (i === 1) {
      if (!value) return;
      ctx.fillStyle = palette.accent;
      ctx.font = 'italic 600 30px "Cormorant Garamond", serif';
      ctx.fillText(value, W / 2, y + 30);
      y += 40;
    } else {
      if (!value) return;
      ctx.fillStyle = hexToRgba(palette.text, 0.78);
      ctx.font = '500 18px Outfit, sans-serif';
      ctx.fillText(value, W / 2, y + 20);
      y += 28;
    }
  });

  return y;
}
