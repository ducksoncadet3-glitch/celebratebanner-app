import { drawCover, roundRect } from '../canvas/helpers.js';
import type { FrameRenderer } from '../types.js';
import { RoundedFrame } from './rounded.js';
import { registerFrame } from './registry.js';

// ── Gold edge: rounded photo + 4px gold stroke ──────────────────────
export const GoldFrame: FrameRenderer = {
  id: 'gold',
  label: 'Gold edge',
  draw(ctx, img, x, y, w, h, withShadow) {
    RoundedFrame.draw(ctx, img, x, y, w, h, withShadow);
    ctx.save();
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 4;
    roundRect(ctx, x, y, w, h, 12);
    ctx.stroke();
    ctx.restore();
  },
};

// ── Double gold: 2 concentric gold rectangles ───────────────────────
export const DoubleGoldFrame: FrameRenderer = {
  id: 'double-gold',
  label: 'Double gold',
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
    ctx.save();
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
    ctx.restore();
  },
};

// ── Baroque: double stroke (heavy + thin), no embellishments ────────
export const BaroqueFrame: FrameRenderer = {
  id: 'baroque',
  label: 'Baroque',
  draw(ctx, img, x, y, w, h, withShadow) {
    if (withShadow) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 7;
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
    ctx.save();
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
    ctx.strokeStyle = '#E8C97A';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 9, y + 9, w - 18, h - 18);
    ctx.restore();
  },
};

// ── Ribbon: plain rect + 3px gold stroke ────────────────────────────
export const RibbonFrame: FrameRenderer = {
  id: 'ribbon',
  label: 'Ribbon',
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
    ctx.save();
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  },
};

// ── Crown: gold-stroked photo + decorative crown above top edge ─────
export const CrownFrame: FrameRenderer = {
  id: 'crown',
  label: 'Crown',
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
    ctx.save();
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
    // Crown above top center
    const cw = Math.max(22, Math.min(w, h) * 0.14);
    const ch = cw * 0.7;
    const ccx = x + w / 2 - cw / 2;
    const ccy = y - ch - 4;
    ctx.save();
    ctx.fillStyle = '#C9A84C';
    ctx.beginPath();
    ctx.moveTo(ccx, ccy + ch);
    ctx.lineTo(ccx + cw, ccy + ch);
    ctx.lineTo(ccx + cw - cw * 0.15, ccy + ch * 0.42);
    ctx.lineTo(ccx + cw * 0.15, ccy + ch * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(ccx + cw * 0.15, ccy + ch * 0.42);
    ctx.lineTo(ccx + cw * 0.30, ccy);
    ctx.lineTo(ccx + cw * 0.50, ccy + ch * 0.42);
    ctx.lineTo(ccx + cw * 0.70, ccy);
    ctx.lineTo(ccx + cw * 0.85, ccy + ch * 0.42);
    ctx.fill();
    ctx.restore();
  },
};

registerFrame(GoldFrame);
registerFrame(DoubleGoldFrame);
registerFrame(BaroqueFrame);
registerFrame(RibbonFrame);
registerFrame(CrownFrame);
