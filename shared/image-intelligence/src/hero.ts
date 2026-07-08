/**
 * Hero quality — framing rules so the hero DOMINATES and fills its box.
 *
 * Why this exists: the existing renderer's `drawCover` silently falls back to a
 * *contain* fit when the image and its box disagree in aspect by more than 1.55×
 * (render-engine/src/canvas/helpers.ts). That letterboxes/pillarboxes the hero and
 * leaves large dead zones — exactly the "weak hero" problem.
 *
 * We never change the renderer. Instead we hand it a hero image that has ALREADY been
 * cropped to its box's aspect, so `drawCover` always takes the cover path and the hero
 * fills the frame edge to edge. Faces are protected by biasing the crop upward.
 */
import type { ArrangementId, CropRect } from './types.ts';

/** Mirrors render-engine `drawCover`: above this crop ratio it switches to contain. */
export const CONTAIN_THRESHOLD = 1.55;

/**
 * Faces sit high in a portrait, so when we must crop height we keep the TOP of the
 * frame. Without face detection this strong upward bias is the safe default: including
 * a little extra headroom beats decapitating the subject. (0 = flush to the top edge.)
 */
export const FACE_SAFE_FOCUS_Y = 0.10;

export const aspect = (width: number, height: number): number =>
  width > 0 && height > 0 ? width / height : 1;

/** How aggressively a box crops an image — symmetric, always ≥ 1. */
export function cropRatio(imageAspect: number, boxAspect: number): number {
  if (!(imageAspect > 0) || !(boxAspect > 0)) return 1;
  return Math.max(imageAspect / boxAspect, boxAspect / imageAspect);
}

/** True when the renderer would letterbox/pillarbox (i.e. leave dead zones). */
export function wouldLetterbox(imageAspect: number, boxAspect: number, threshold = CONTAIN_THRESHOLD): boolean {
  return cropRatio(imageAspect, boxAspect) > threshold;
}

/** True when the hero fills its box with no dead zones. */
export const heroFillsBox = (imageAspect: number, boxAspect: number): boolean => !wouldLetterbox(imageAspect, boxAspect);

/**
 * The aspect ratio of each arrangement's hero box.
 *
 * This MIRRORS the geometry in render-engine/src/arrangements/* (read-only; we do not
 * modify the renderer). Keep in sync if those constants ever change — the test suite
 * asserts the hero fills its box for every arrangement.
 *
 *   classic   → (W - 2*margin) × 360      (margin 40)
 *   pyramid   → heroSize × heroSize       (square)
 *   mosaic    → 320 × 380
 *   magazine  → 460 × 420
 */
export function heroBoxAspect(arrangement: ArrangementId | string, canvasWidth: number, _canvasHeight?: number): number {
  switch (arrangement) {
    case 'classic': {
      const inner = canvasWidth - 80;
      return inner > 0 ? aspect(inner, 360) : 1;
    }
    case 'pyramid': return 1;
    case 'mosaic': return aspect(320, 380);
    case 'magazine': return aspect(460, 420);
    default: return 1;
  }
}

/** Every supporting tile gets the same disciplined square crop — curated, not raw. */
export const SUPPORTING_ASPECT = 1;

/**
 * The largest sub-rectangle of the source that has `targetAspect`, centered
 * horizontally and biased toward `focusY` vertically so faces survive the crop.
 * Never upscales: the rect is always inside the source.
 */
export function coverCropRect(
  srcWidth: number,
  srcHeight: number,
  targetAspect: number,
  focusY: number = FACE_SAFE_FOCUS_Y,
): CropRect {
  const w = srcWidth > 0 ? srcWidth : 1;
  const h = srcHeight > 0 ? srcHeight : 1;
  const target = targetAspect > 0 ? targetAspect : 1;
  const srcAspect = w / h;
  const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

  if (srcAspect > target) {
    // Source too wide → crop width, keep full height, center horizontally.
    const sw = h * target;
    return { sx: (w - sw) / 2, sy: 0, sw, sh: h };
  }
  // Source too tall (or equal) → crop height, keep full width, bias upward for faces.
  const sh = w / target;
  const sy = clamp((h - sh) * clamp(focusY, 0, 1), 0, Math.max(0, h - sh));
  return { sx: 0, sy, sw: w, sh };
}

/** Hero dominance the plan asks for, clamped to a sane, never-reduced range. */
export function enforceHeroDominance(requested: number, floor = 0.5, ceiling = 0.85): number {
  if (!Number.isFinite(requested)) return floor;
  return Math.min(ceiling, Math.max(floor, requested));
}
