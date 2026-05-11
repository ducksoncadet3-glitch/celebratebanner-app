import { drawCover, roundRect } from '../canvas/helpers.js';
import type { CanvasImage, FrameRenderer, RenderContext } from '../types.js';
import { registerFrame } from './registry.js';

/** Rounded rectangle photo — the default frame. */
export const RoundedFrame: FrameRenderer = {
  id: 'rounded',
  label: 'Rounded',
  draw(ctx: RenderContext, img: CanvasImage, x: number, y: number, w: number, h: number, withShadow: boolean) {
    if (withShadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#000';
      roundRect(ctx, x, y, w, h, 12);
      ctx.fill();
      ctx.restore();
    }
    ctx.save();
    roundRect(ctx, x, y, w, h, 12);
    ctx.clip();
    drawCover(ctx, img, x, y, w, h);
    ctx.restore();
  },
};

registerFrame(RoundedFrame);
