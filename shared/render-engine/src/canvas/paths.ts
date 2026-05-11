import type { RenderContext } from '../types.js';

/** Pointy-top hexagon inscribed in the smaller of (w, h), centered in the cell. */
export function hexPath(ctx: RenderContext, x: number, y: number, w: number, h: number): void {
  const size = Math.min(w, h);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = size / 2;
  const ry = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - ry);
  ctx.lineTo(cx + rx, cy - ry / 2);
  ctx.lineTo(cx + rx, cy + ry / 2);
  ctx.lineTo(cx, cy + ry);
  ctx.lineTo(cx - rx, cy + ry / 2);
  ctx.lineTo(cx - rx, cy - ry / 2);
  ctx.closePath();
}

/** Inscribed diamond (square rotated 45°). */
export function diamondPath(ctx: RenderContext, x: number, y: number, w: number, h: number): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const s = Math.min(w, h) / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s, cy);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx - s, cy);
  ctx.closePath();
}

/** Scalloped (flower-edge) circle. */
export function scallopPath(ctx: RenderContext, cx: number, cy: number, r: number): void {
  const lobes = 14;
  const bump = r * 0.07;
  ctx.beginPath();
  for (let deg = 0; deg <= 360; deg += 1) {
    const a = (deg * Math.PI) / 180;
    const rr = r - bump + bump * Math.cos(lobes * a);
    const px = cx + Math.cos(a) * rr;
    const py = cy + Math.sin(a) * rr;
    if (deg === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Heart shape inscribed in the cell (uses two bezier curves). */
export function heartPath(ctx: RenderContext, x: number, y: number, w: number, h: number): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const s = Math.min(w, h) * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.65);
  ctx.bezierCurveTo(cx - s * 1.0, cy + s * 0.10, cx - s * 0.7, cy - s * 0.85, cx, cy - s * 0.25);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s * 0.85, cx + s * 1.0, cy + s * 0.10, cx, cy + s * 0.65);
  ctx.closePath();
}

/** Five-pointed star inscribed in the smaller of (w, h). */
export function starPath(ctx: RenderContext, x: number, y: number, w: number, h: number): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const outer = Math.min(w, h) / 2;
  const inner = outer * 0.45;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}
