import { drawCover } from '../canvas/helpers.js';
import { diamondPath, heartPath, hexPath, scallopPath, starPath } from '../canvas/paths.js';
import type { CanvasImage, FrameRenderer, RenderContext } from '../types.js';
import { registerFrame } from './registry.js';

function withDrop(ctx: RenderContext, blur: number, off: number, pathFn: () => void) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = off;
  ctx.fillStyle = '#000';
  pathFn();
  ctx.fill();
  ctx.restore();
}

function withGoldOutline(ctx: RenderContext, lineWidth: number, pathFn: () => void) {
  ctx.save();
  ctx.strokeStyle = 'rgba(201,168,76,0.9)';
  ctx.lineWidth = lineWidth;
  pathFn();
  ctx.stroke();
  ctx.restore();
}

// ── Circle ────────────────────────────────────────────────────────────
export const CircleFrame: FrameRenderer = {
  id: 'circle',
  label: 'Circle',
  draw(ctx, img, x, y, w, h, withShadow) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) / 2;
    const p = () => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); };
    if (withShadow) withDrop(ctx, 18, 8, p);
    ctx.save(); p(); ctx.clip();
    drawCover(ctx, img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  },
};

// ── Hexagon ───────────────────────────────────────────────────────────
export const HexagonFrame: FrameRenderer = {
  id: 'hexagon',
  label: 'Hexagon',
  draw(ctx, img, x, y, w, h, withShadow) {
    const size = Math.min(w, h);
    const p = () => hexPath(ctx, x, y, w, h);
    if (withShadow) withDrop(ctx, 18, 8, p);
    ctx.save(); p(); ctx.clip();
    drawCover(ctx, img, x + (w - size) / 2, y + (h - size) / 2, size, size);
    ctx.restore();
    withGoldOutline(ctx, 2, p);
  },
};

// ── Diamond ───────────────────────────────────────────────────────────
export const DiamondFrame: FrameRenderer = {
  id: 'diamond',
  label: 'Diamond',
  draw(ctx, img, x, y, w, h, withShadow) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const s = Math.min(w, h) / 2;
    const p = () => diamondPath(ctx, x, y, w, h);
    if (withShadow) withDrop(ctx, 18, 8, p);
    ctx.save(); p(); ctx.clip();
    drawCover(ctx, img, cx - s, cy - s, s * 2, s * 2);
    ctx.restore();
    withGoldOutline(ctx, 2, p);
  },
};

// ── Scallop ───────────────────────────────────────────────────────────
export const ScallopFrame: FrameRenderer = {
  id: 'scallop',
  label: 'Scallop',
  draw(ctx, img, x, y, w, h, withShadow) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) / 2;
    const p = () => scallopPath(ctx, cx, cy, r);
    if (withShadow) withDrop(ctx, 16, 7, p);
    ctx.save(); p(); ctx.clip();
    drawCover(ctx, img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(201,168,76,0.85)';
    ctx.lineWidth = 1.5;
    p(); ctx.stroke();
    ctx.restore();
  },
};

// ── Heart ─────────────────────────────────────────────────────────────
export const HeartFrame: FrameRenderer = {
  id: 'heart',
  label: 'Heart',
  draw(ctx, img, x, y, w, h, withShadow) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const size = Math.min(w, h);
    const p = () => heartPath(ctx, x, y, w, h);
    if (withShadow) withDrop(ctx, 18, 8, p);
    ctx.save(); p(); ctx.clip();
    drawCover(ctx, img, cx - size / 2, cy - size / 2, size, size);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(201,168,76,0.85)';
    ctx.lineWidth = 1.5;
    p(); ctx.stroke();
    ctx.restore();
  },
};

// ── Star ──────────────────────────────────────────────────────────────
export const StarFrame: FrameRenderer = {
  id: 'star',
  label: 'Star',
  draw(ctx, img, x, y, w, h, withShadow) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const size = Math.min(w, h);
    const p = () => starPath(ctx, x, y, w, h);
    if (withShadow) withDrop(ctx, 16, 7, p);
    ctx.save(); p(); ctx.clip();
    drawCover(ctx, img, cx - size / 2, cy - size / 2, size, size);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = 'rgba(201,168,76,0.85)';
    ctx.lineWidth = 1.5;
    p(); ctx.stroke();
    ctx.restore();
  },
};

registerFrame(CircleFrame);
registerFrame(HexagonFrame);
registerFrame(DiamondFrame);
registerFrame(ScallopFrame);
registerFrame(HeartFrame);
registerFrame(StarFrame);
