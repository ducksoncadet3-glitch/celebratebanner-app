/**
 * @celebratebanner/image-intelligence — types
 *
 * Pure, pixel-free decision logic that makes rendered WOW concepts look intentional:
 * orientation correction, hero framing, supporting-photo curation, and banner-text
 * cleanup. It DECIDES; the render binding executes. No DOM, no canvas, no I/O.
 *
 * It never modifies uploaded files — corrections are applied at draw time only, in
 * the WOW pipeline / render-preview path.
 */

export const SCHEMA_VERSION = '1.0.0';

export type Orientation = 'portrait' | 'landscape' | 'square';

/** Clockwise quarter turns to apply before drawing. */
export type QuarterTurns = 0 | 1 | 2 | 3;

/** The renderer's four arrangements (read-only vocabulary). */
export type ArrangementId = 'classic' | 'magazine' | 'mosaic' | 'pyramid';

/** A source-rectangle crop, in source-image pixels. */
export interface CropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface OrientationCorrection {
  /** Quarter turns to bake in before drawing (0 = pass through). */
  quarterTurns: QuarterTurns;
  /** True when any correction will be applied. */
  corrected: boolean;
  /** Human-readable why — surfaced for debugging, never for fabrication. */
  reason: string;
  /** Dimensions + orientation the renderer will effectively see. */
  effective: { width: number; height: number; orientation: Orientation };
}

export interface OrientationInput {
  width: number;
  height: number;
  /** Orientation the pipeline believes this photo has (from the Memory Profile). */
  declaredOrientation?: Orientation | string | null;
  /** The customer's own rotation from the builder, in degrees (0/90/180/270). */
  userRotationDegrees?: unknown;
}

/** Anything that can be de-duplicated by perceptual hash. */
export interface Curatable {
  id: string;
  /** Hex perceptual hash (e.g. 16-char aHash). Missing → never treated as a duplicate. */
  perceptualHash?: string | null;
}

export interface CurationOptions {
  /** Max Hamming distance (bits) at/under which two photos count as near-identical. */
  maxDistance?: number;
  /** Optional cap on how many photos survive curation. */
  limit?: number;
  /** Never let curation drop below this many photos — protects the story. Default 4. */
  minKeep?: number;
}

export interface CurationResult<T> {
  kept: T[];
  dropped: { id: string; duplicateOf: string; distance: number }[];
}
