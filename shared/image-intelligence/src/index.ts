/**
 * @celebratebanner/image-intelligence
 *
 * Pure decision logic that makes rendered WOW concepts look intentional:
 *
 *   • orientation — non-destructive quarter-turn correction (honors the customer's
 *     rotation; reconciles "sideways" images) with a safe pass-through fallback.
 *   • hero        — crop the hero to its box's aspect so the renderer's drawCover
 *     always takes the COVER path (no letterbox/pillarbox dead zones); faces protected.
 *   • curation    — drop near-identical supporting photos by perceptual-hash distance.
 *   • text        — replace raw builder placeholders with dignified labels; never
 *     overwrite real customer text, never invent a name.
 *
 * It DECIDES; the WOW render binding executes. No DOM, no canvas, no I/O, no pixels.
 * Uploaded files are never modified — corrections apply at draw time only.
 */
export { SCHEMA_VERSION } from './types.ts';
export type {
  Orientation, QuarterTurns, ArrangementId, CropRect,
  OrientationCorrection, OrientationInput, Curatable, CurationOptions, CurationResult,
} from './types.ts';

export { detectOrientation, normalizeQuarterTurns, applyQuarterTurns, planOrientationCorrection, SQUARE_TOLERANCE } from './orientation.ts';
export { aspect, cropRatio, wouldLetterbox, heroFillsBox, heroBoxAspect, coverCropRect, enforceHeroDominance, CONTAIN_THRESHOLD, FACE_SAFE_FOCUS_Y, SUPPORTING_ASPECT } from './hero.ts';
export { hammingDistance, isNearDuplicate, curatePhotos, DEFAULT_MAX_DISTANCE, DEFAULT_MIN_KEEP } from './curation.ts';
export { isPlaceholderText, sanitizeBannerText, DIGNIFIED_LABELS } from './text.ts';
