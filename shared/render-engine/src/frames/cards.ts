import { drawCover, roundRect } from '../canvas/helpers.js';
import type { FrameRenderer } from '../types.js';
import { registerFrame } from './registry.js';

// ── Polaroid: white card, photo top, caption pad bottom ─────────────
export const PolaroidFrame: FrameRenderer = {
  id: 'polaroid',
  label: 'Polaroid',
  draw(ctx, img, x, y, w, h, withShadow) {
    const pad = Math.min(w, h) * 0.06;
    const bPad = Math.min(w, h) * 0.16;
    ctx.save();
    if (withShadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 10;
    }
    ctx.fillStyle = '#FAF8F3';
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + pad, y + pad, w - pad * 2, h - pad - bPad);
    ctx.clip();
    drawCover(ctx, img, x + pad, y + pad, w - pad * 2, h - pad - bPad);
    ctx.restore();
  },
};

// ── Vintage: cream paper card + sepia photo ──────────────────────────
export const VintageFrame: FrameRenderer = {
  id: 'vintage',
  label: 'Vintage',
  draw(ctx, img, x, y, w, h, withShadow) {
    if (withShadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.40)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#F5EDD8';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = '#F5EDD8';
      ctx.fillRect(x, y, w, h);
    }
    const pad = Math.min(w, h) * 0.06;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + pad, y + pad, w - pad * 2, h - pad * 2);
    ctx.clip();
    ctx.filter = 'sepia(0.55) saturate(1.05) contrast(0.95)';
    drawCover(ctx, img, x + pad, y + pad, w - pad * 2, h - pad * 2);
    ctx.filter = 'none';
    ctx.restore();
  },
};

// ── Washi tape: plain photo + two diagonal tape strips ───────────────
export const TapeFrame: FrameRenderer = {
  id: 'tape',
  label: 'Washi tape',
  draw(ctx, img, x, y, w, h, withShadow) {
    if (withShadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.40)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#000';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    drawCover(ctx, img, x, y, w, h);
    ctx.restore();

    const tw = Math.min(w, h) * 0.34;
    const th = Math.min(w, h) * 0.10;
    ctx.save();
    ctx.fillStyle = 'rgba(232,201,122,0.72)';
    ctx.translate(x, y);
    ctx.rotate((-22 * Math.PI) / 180);
    ctx.fillRect(-tw * 0.30, -th / 2, tw, th);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = 'rgba(232,201,122,0.72)';
    ctx.translate(x + w, y + h);
    ctx.rotate((-22 * Math.PI) / 180);
    ctx.fillRect(-tw * 0.70, -th / 2, tw, th);
    ctx.restore();
  },
};

// ── White edge: thin ivory border, photo inset ──────────────────────
export const WhiteFrame: FrameRenderer = {
  id: 'white',
  label: 'White edge',
  draw(ctx, img, x, y, w, h, withShadow) {
    if (withShadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.40)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#FAF8F3';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    } else {
      ctx.fillStyle = '#FAF8F3';
      ctx.fillRect(x, y, w, h);
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 3, y + 3, w - 6, h - 6);
    ctx.clip();
    drawCover(ctx, img, x + 3, y + 3, w - 6, h - 6);
    ctx.restore();
  },
};

registerFrame(PolaroidFrame);
registerFrame(VintageFrame);
registerFrame(TapeFrame);
registerFrame(WhiteFrame);
