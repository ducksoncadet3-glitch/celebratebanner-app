import type { CanvasImage, RenderContext } from '../types.js';

/** Rounded rectangle path. Call before fill/stroke/clip. */
export function roundRect(ctx: RenderContext, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Object-fit: cover. Always fills the (w × h) target completely, cropping the
 * image edges as needed. Auto-falls back to contain when cover would crop more
 * than ~35% of the image, so portrait faces aren't reduced to zoomed pixels.
 *
 * Per-image flags honored:
 *   img._rotDeg     — 90° increments set by drawPhotoFramed (user rotation)
 *   img._useContain — opt-in to contain-fit (hero photos)
 */
export function drawCover(
  ctx: RenderContext,
  img: CanvasImage & { _useContain?: boolean },
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (!img) return;
  const iw = img.naturalWidth ?? img.width ?? 1;
  const ih = img.naturalHeight ?? img.height ?? 1;
  const rotDeg = (((img._rotDeg ?? 0) % 360) + 360) % 360;
  const swap = rotDeg === 90 || rotDeg === 270;
  const effW = swap ? ih : iw;
  const effH = swap ? iw : ih;

  const coverScale = Math.max(w / effW, h / effH);
  const containScale = Math.min(w / effW, h / effH);
  const cropRatio = coverScale / containScale;
  const useContain = img._useContain === true || cropRatio > 1.55;
  const scale = useContain ? containScale : coverScale;

  const dw = iw * scale;
  const dh = ih * scale;
  const cx = x + w / 2;
  const cy = y + h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  if (rotDeg) ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.drawImage(img as unknown as CanvasImageSource, 0, 0, iw, ih, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

/** Lighten a #RRGGBB hex by `amt` per channel (0..255). */
export function lightenHex(hex: string, amt: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 0xff;
  let g = (n >> 8) & 0xff;
  let b = n & 0xff;
  r = Math.min(255, r + amt);
  g = Math.min(255, g + amt);
  b = Math.min(255, b + amt);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

/** Convert #RRGGBB → rgba(...) with the given alpha. */
export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff},${alpha})`;
}

/**
 * Repeat the base array to produce exactly `count` entries so layouts always
 * fill every slot, even when the user uploaded fewer photos than the slot
 * count. Returns shallow clones so callers can mutate without aliasing.
 */
export function tileToCount<T>(base: T[], count: number): T[] {
  const out: T[] = [];
  if (!base || base.length === 0) return out;
  for (let i = 0; i < count; i++) out.push({ ...base[i % base.length] });
  return out;
}
