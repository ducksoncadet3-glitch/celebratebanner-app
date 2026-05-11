import { drawCover, roundRect } from '../canvas/helpers.js';
import type { CanvasImage, Photo, RenderContext, RenderInput } from '../types.js';
import { getFrame } from './registry.js';

export interface DrawPhotoOptions {
  /** Override the frame normally resolved from the photo. */
  forceFrame?: string;
  /** Tile rotation in radians (for jitter / scrapbook layouts). */
  rotation?: number;
  /** When given, the (x, y, w, h) box is treated as relative to (cx, cy). */
  cx?: number;
  cy?: number;
  /** Toggle the per-frame drop shadow. Default true. */
  shadow?: boolean;
}

/**
 * Resolve the per-photo frame + rotation and dispatch to the frame renderer.
 * Mirrors drawPhotoFramed() from index.html exactly.
 */
export function drawPhotoFramed(
  ctx: RenderContext,
  input: RenderInput,
  photo: Photo,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: DrawPhotoOptions = {},
): void {
  const frameId = (opts.forceFrame ?? input.frames?.[photo.id] ?? input.defaultFrame ?? 'rounded') as string;
  const rotation = opts.rotation ?? 0;
  const shadow = opts.shadow !== false;

  // Plumb the user's 90° rotation into the image for drawCover.
  if (photo.image) {
    (photo.image as CanvasImage & { _rotDeg?: number })._rotDeg =
      input.rotations?.[photo.id] ?? 0;
  }

  ctx.save();
  let px = x;
  let py = y;
  if (rotation) {
    const tcx = opts.cx ?? x + w / 2;
    const tcy = opts.cy ?? y + h / 2;
    ctx.translate(tcx, tcy);
    ctx.rotate(rotation);
    px = -w / 2;
    py = -h / 2;
  } else if (opts.cx != null && opts.cy != null) {
    ctx.translate(opts.cx, opts.cy);
    px = -w / 2;
    py = -h / 2;
  }

  const frame = getFrame(frameId as never);
  frame.draw(ctx, photo.image, px, py, w, h, shadow);

  ctx.restore();
}

/**
 * Cinematic hero card — heavy 3D shadow, gold-stroked rounded rectangle, and a
 * specular highlight across the upper-left. Drawn LAST in every layout so the
 * hero floats above the collage. Ported verbatim from index.html.
 */
export function drawHero3D(
  ctx: RenderContext,
  input: RenderInput,
  photo: Photo,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (!photo || !photo.image) return;
  if (photo.image) {
    (photo.image as CanvasImage & { _rotDeg?: number })._rotDeg =
      input.rotations?.[photo.id] ?? 0;
  }
  const radius = 14;

  // Pass 1 — outer drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetX = 18;
  ctx.shadowOffsetY = 28;
  ctx.fillStyle = '#000';
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.restore();

  // Pass 2 — close ambient shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 10;
  ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#111';
  roundRect(ctx, x + 2, y + 2, w, h, radius);
  ctx.fill();
  ctx.restore();

  // Photo
  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.clip();
  drawCover(ctx, photo.image, x, y, w, h);
  ctx.restore();

  // Gold stroke with halo
  ctx.save();
  ctx.strokeStyle = '#C9A84C';
  ctx.lineWidth = 3;
  ctx.shadowColor = 'rgba(201,168,76,0.6)';
  ctx.shadowBlur = 12;
  roundRect(ctx, x, y, w, h, radius);
  ctx.stroke();
  ctx.restore();

  // Specular highlight upper-left
  ctx.save();
  const shine = ctx.createLinearGradient(x, y, x + w * 0.6, y + h * 0.4);
  shine.addColorStop(0, 'rgba(255,255,255,0.18)');
  shine.addColorStop(0.4, 'rgba(255,255,255,0.06)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.restore();
}

/**
 * Scattered-layout photo: rotated card with rim shadow + thin white edge.
 * Used by Scattered arrangement; matches the original draw3DPhoto.
 */
export function drawPhoto3D(
  ctx: RenderContext,
  input: RenderInput,
  photo: Photo,
  cx: number,
  cy: number,
  w: number,
  h: number,
  rotation: number,
  offY = 10,
  blur = 22,
): void {
  if (!photo || !photo.image) return;
  (photo.image as CanvasImage & { _rotDeg?: number })._rotDeg =
    input.rotations?.[photo.id] ?? 0;
  ctx.save();
  if (rotation) {
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    cx = 0;
    cy = 0;
  }
  const x = cx - w / 2;
  const y = cy - h / 2;
  const radius = 8;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 6;
  ctx.shadowOffsetY = offY;
  ctx.fillStyle = '#000';
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.clip();
  drawCover(ctx, photo.image, x, y, w, h);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, radius);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
