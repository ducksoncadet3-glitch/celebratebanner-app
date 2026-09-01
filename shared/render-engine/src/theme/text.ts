import { hexToRgba } from '../canvas/helpers.js';
import { drawFittedText, fitText, TEXT_SAFE_INSET } from './fit-text.js';
import type { BannerText, RenderContext, Theme } from '../types.js';

/**
 * Render the banner headline + sub fields at the top of the canvas.
 *
 * Layout intent (unchanged):
 *   • Field 0 (headline) — 64px serif. Empty → italic placeholder in muted accent.
 *   • Field 1            — 30px italic serif, accent color. Skipped if empty.
 *   • Field 2+           — 18px sans, 78% accent. Skipped if empty.
 *
 * Every one of these is customer-supplied, so each is fitted to a safe area before being
 * drawn (see ./fit-text). Text that already fits at its preferred size is drawn at exactly
 * that size, so existing short headlines like "Champions" are pixel-identical to before.
 *
 * Returns the Y coordinate of the bottom of the rendered text, so callers can place photo
 * content directly below. A wrapped headline grows that value, so photos are pushed down
 * rather than overlapped.
 */

export { TEXT_SAFE_INSET } from './fit-text.js';

/** Per-tier fitting policy. Headline may wrap to a second line; sub-fields stay single. */
const HEADLINE = { preferred: 64, min: 34, maxLines: 2, lineHeightRatio: 1.12 };
const PLACEHOLDER = { preferred: 56, min: 30, maxLines: 2, lineHeightRatio: 1.12 };
const SUBHEAD = { preferred: 30, min: 18, maxLines: 1, lineHeightRatio: 1.15 };
const DETAIL = { preferred: 18, min: 12, maxLines: 1, lineHeightRatio: 1.2 };

export function renderBannerText(
  ctx: RenderContext,
  W: number,
  topY: number,
  theme: Theme,
  bannerText: BannerText,
): number {
  const fields = theme.fields ?? [];
  const palette = theme.palette;
  const maxWidth = Math.max(1, W - TEXT_SAFE_INSET * 2);
  let y = topY;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  fields.forEach((key, i) => {
    const value = (bannerText[key] ?? '').trim();

    if (i === 0) {
      const isPlaceholder = !value;
      const meta = theme.fieldMeta?.[key];
      const text = isPlaceholder ? meta?.placeholder || `Your ${key}` : value;
      const policy = isPlaceholder ? PLACEHOLDER : HEADLINE;
      const font = isPlaceholder
        ? (s: number) => `italic 600 ${s}px "Cormorant Garamond", serif`
        : (s: number) => `bold ${s}px "Cormorant Garamond", serif`;

      ctx.fillStyle = isPlaceholder ? hexToRgba(palette.text, 0.45) : palette.text;
      const fitted = fitText(ctx, text, {
        maxWidth,
        preferredSize: policy.preferred,
        minSize: policy.min,
        maxLines: policy.maxLines,
        font,
      });
      ctx.font = font(fitted.fontSize);
      const lineHeight = Math.round(fitted.fontSize * policy.lineHeightRatio);
      drawFittedText(ctx, fitted, W / 2, y + 56, lineHeight);
      // Original single-line advance, plus the height of any extra wrapped lines.
      y += 74 + (fitted.lines.length - 1) * lineHeight;
    } else if (i === 1) {
      if (!value) return;
      const font = (s: number) => `italic 600 ${s}px "Cormorant Garamond", serif`;
      ctx.fillStyle = palette.accent;
      const fitted = fitText(ctx, value, {
        maxWidth,
        preferredSize: SUBHEAD.preferred,
        minSize: SUBHEAD.min,
        maxLines: SUBHEAD.maxLines,
        font,
      });
      ctx.font = font(fitted.fontSize);
      const lineHeight = Math.round(fitted.fontSize * SUBHEAD.lineHeightRatio);
      drawFittedText(ctx, fitted, W / 2, y + 30, lineHeight);
      y += 40 + (fitted.lines.length - 1) * lineHeight;
    } else {
      if (!value) return;
      const font = (s: number) => `500 ${s}px Outfit, sans-serif`;
      ctx.fillStyle = hexToRgba(palette.text, 0.78);
      const fitted = fitText(ctx, value, {
        maxWidth,
        preferredSize: DETAIL.preferred,
        minSize: DETAIL.min,
        maxLines: DETAIL.maxLines,
        font,
      });
      ctx.font = font(fitted.fontSize);
      const lineHeight = Math.round(fitted.fontSize * DETAIL.lineHeightRatio);
      drawFittedText(ctx, fitted, W / 2, y + 20, lineHeight);
      y += 28 + (fitted.lines.length - 1) * lineHeight;
    }
  });

  return y;
}
