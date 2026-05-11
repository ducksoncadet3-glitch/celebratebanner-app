import { renderBanner } from './render.js';
import type { RenderInput, RenderTarget } from '../types.js';

export interface PreviewOptions {
  /** Logical canvas width — lower is faster. Default 800. */
  previewWidth?: number;
  /** Logical canvas height — keep the 2:3 ratio for a banner. Default 1200. */
  previewHeight?: number;
  /** Device-pixel scaling. Default 1 (no upscaling on the preview canvas). */
  dpr?: number;
}

/**
 * Browser-friendly preview render. Targets a small canvas (default 800×1200
 * logical pixels, 1× DPR) so it can recompose in under ~200ms even on mid-tier
 * laptops, which keeps the live preview from blocking the UI thread.
 *
 * For HD print exports, use `pipeline/export.ts` instead.
 */
export function renderPreview(target: RenderTarget, input: RenderInput, opts: PreviewOptions = {}): void {
  const W = opts.previewWidth ?? 800;
  const H = opts.previewHeight ?? 1200;
  const dpr = opts.dpr ?? 1;
  target.width = W * dpr;
  target.height = H * dpr;
  const ctx = target.getContext('2d');
  if (dpr !== 1) ctx.scale(dpr, dpr);
  renderBanner(ctx, { ...input, width: W, height: H });
}
