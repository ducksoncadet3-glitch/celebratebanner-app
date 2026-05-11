import { renderBanner } from './render.js';
import type { RenderInput, RenderTarget } from '../types.js';

export interface ExportOptions {
  /**
   * Banner size in inches. Defaults to 24×36. The renderer paints into a
   * logical 800×1200 grid that's then scaled up to (size.widthIn × dpi) ×
   * (size.heightIn × dpi) pixels so layout math stays identical to the preview.
   */
  size?: { widthIn: number; heightIn: number };
  /** Print DPI. CelebrateBanner standard is 300. */
  dpi?: number;
}

/**
 * Server-side HD export. Renders into a 300 DPI canvas (24×36 in = 7200×10800
 * pixels by default). The caller passes any 2D RenderTarget — typically a
 * node-canvas or skia-canvas Canvas with PNG/JPEG encoding via toBuffer().
 *
 * The math is identical to the preview, just at higher resolution: we scale
 * the context so renderers use the same 800×1200 logical coordinate space.
 */
export function renderHD(target: RenderTarget, input: RenderInput, opts: ExportOptions = {}): void {
  const dpi = opts.dpi ?? 300;
  const size = opts.size ?? { widthIn: 24, heightIn: 36 };
  const fullW = Math.round(size.widthIn * dpi);
  const fullH = Math.round(size.heightIn * dpi);

  // Keep layout math in the canonical 800×1200 grid; scale the context up.
  const logicalW = 800;
  const logicalH = 1200;
  const scale = fullW / logicalW;
  // logicalH * scale should equal fullH for a 2:3 banner; if not, accept the
  // discrepancy — the print spec drives, but our layouts are 2:3 by design.

  target.width = fullW;
  target.height = fullH;
  const ctx = target.getContext('2d');
  ctx.scale(scale, scale);
  renderBanner(ctx, { ...input, width: logicalW, height: logicalH });
}
