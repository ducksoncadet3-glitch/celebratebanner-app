/**
 * Orientation intelligence — decides how many quarter turns a photo needs before it
 * is drawn, WITHOUT ever modifying the uploaded file. Two signals are honored:
 *
 *   1. The customer's own rotation from the builder (degrees, 0/90/180/270).
 *   2. A mismatch between the orientation the pipeline believes a photo has and the
 *      orientation its pixels actually have — a strong "this image is sideways" tell.
 *
 * When neither signal is trustworthy (bad dimensions, unknown/square orientation) the
 * decision is a safe pass-through: 0 turns. Deterministic; no pixels are read.
 */
import type { Orientation, QuarterTurns, OrientationCorrection, OrientationInput } from './types.ts';

/** Fractional tolerance within which an image counts as square. */
export const SQUARE_TOLERANCE = 0.02;

export function detectOrientation(width: number, height: number, tolerance = SQUARE_TOLERANCE): Orientation {
  if (!(width > 0) || !(height > 0)) return 'square';
  const ratio = width / height;
  if (Math.abs(ratio - 1) <= tolerance) return 'square';
  return ratio > 1 ? 'landscape' : 'portrait';
}

/** Coerce a rotation (degrees or turns) into 0–3 clockwise quarter turns. Junk → 0. */
export function normalizeQuarterTurns(value: unknown): QuarterTurns {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  // Accept degrees (multiples of 90) or a raw turn count.
  const turns = Math.abs(n) >= 45 ? Math.round(n / 90) : Math.round(n);
  const wrapped = ((turns % 4) + 4) % 4;
  return wrapped as QuarterTurns;
}

/** Dimensions after applying quarter turns (odd turns swap width/height). */
export function applyQuarterTurns(width: number, height: number, turns: QuarterTurns): { width: number; height: number } {
  return turns % 2 === 1 ? { width: height, height: width } : { width, height };
}

const norm = (o: unknown): Orientation | null =>
  o === 'portrait' || o === 'landscape' || o === 'square' ? o : null;

/**
 * Plan the (non-destructive) orientation correction for one photo.
 * Falls back to a pass-through whenever orientation cannot be determined.
 */
export function planOrientationCorrection(input: OrientationInput): OrientationCorrection {
  const { width, height } = input;

  // Fallback: undeterminable dimensions → never guess.
  if (!(width > 0) || !(height > 0) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return {
      quarterTurns: 0,
      corrected: false,
      reason: 'Dimensions unavailable — orientation left untouched.',
      effective: { width: width || 0, height: height || 0, orientation: 'square' },
    };
  }

  const reasons: string[] = [];
  let turns = normalizeQuarterTurns(input.userRotationDegrees);
  let eff = applyQuarterTurns(width, height, turns);

  if (turns !== 0) {
    // The customer's own rotation is authoritative intent. Do NOT also apply the
    // mismatch rule — a declaredOrientation derived from the same pre-rotation
    // dimensions is stale, and correcting twice would put the photo back sideways.
    reasons.push(`Honored the customer's ${turns * 90}° rotation.`);
  } else {
    const declared = norm(input.declaredOrientation);
    const actual = detectOrientation(eff.width, eff.height);
    // Mismatch tell: the pipeline expects portrait but the pixels are landscape (or
    // vice versa) — a sideways image. One quarter turn reconciles them.
    // Square/unknown declared orientation → no correction (safe fallback).
    if (declared && declared !== 'square' && actual !== 'square' && declared !== actual) {
      turns = 1;
      eff = applyQuarterTurns(width, height, turns);
      reasons.push(`Corrected a ${actual} image the pipeline expected to be ${declared}.`);
    }
  }

  return {
    quarterTurns: turns,
    corrected: turns !== 0,
    reason: reasons.length ? reasons.join(' ') : 'Orientation already correct — no change.',
    effective: { width: eff.width, height: eff.height, orientation: detectOrientation(eff.width, eff.height) },
  };
}
