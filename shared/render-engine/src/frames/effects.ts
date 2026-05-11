import { drawCover, roundRect } from '../canvas/helpers.js';
import type { FrameRenderer } from '../types.js';
import { registerFrame } from './registry.js';

// ── Neon glow: cyan stroke with shadow blur ─────────────────────────
export const NeonFrame: FrameRenderer = {
  id: 'neon',
  label: 'Neon glow',
  draw(ctx, img, x, y, w, h, _withShadow) {
    ctx.save();
    roundRect(ctx, x, y, w, h, 8);
    ctx.clip();
    drawCover(ctx, img, x, y, w, h);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = '#22E8FF';
    ctx.shadowColor = '#22E8FF';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();
    ctx.restore();
  },
};

// ── Glitter: gold dots along perimeter ──────────────────────────────
export const GlitterFrame: FrameRenderer = {
  id: 'glitter',
  label: 'Glitter',
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
    const dr = Math.max(1.6, Math.min(w, h) * 0.012);
    const step = dr * 4;
    ctx.fillStyle = '#E8C97A';
    ctx.shadowColor = 'rgba(232,201,122,0.7)';
    ctx.shadowBlur = 6;
    for (let px = x; px <= x + w + 0.1; px += step) {
      ctx.beginPath(); ctx.arc(px, y, dr, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(px, y + h, dr, 0, Math.PI * 2); ctx.fill();
    }
    for (let py = y + step; py <= y + h - step + 0.1; py += step) {
      ctx.beginPath(); ctx.arc(x, py, dr, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w, py, dr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },
};

// ── Drop shadow: no border, big soft shadow only ────────────────────
export const ShadowFrame: FrameRenderer = {
  id: 'shadow',
  label: 'Drop shadow',
  draw(ctx, img, x, y, w, h, _withShadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    drawCover(ctx, img, x, y, w, h);
    ctx.restore();
  },
};

// ── Shadow box: extra-heavy shadow for depth illusion ───────────────
export const ShadowBoxFrame: FrameRenderer = {
  id: 'shadow-box',
  label: 'Shadow box',
  draw(ctx, img, x, y, w, h, _withShadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    drawCover(ctx, img, x, y, w, h);
    ctx.restore();
  },
};

registerFrame(NeonFrame);
registerFrame(GlitterFrame);
registerFrame(ShadowFrame);
registerFrame(ShadowBoxFrame);
