/**
 * @celebratebanner/memory-profile — type definitions
 *
 * The Memory Profile is the single source of truth produced by the AI Creative
 * Director's analysis stage. No renderer inspects raw photos directly — every
 * downstream system consumes the MemoryProfile.
 *
 * See docs/MEMORY_PROFILE_SCHEMA.md for the authoritative field reference.
 */

export const SCHEMA_VERSION = '1.0.0';

/** Celebration types. Mirrors the Design Bible product ecosystem. */
export type OccasionType =
  | 'graduation'
  | 'championship'
  | 'team'
  | 'wedding'
  | 'birthday'
  | 'baby_shower'
  | 'retirement'
  | 'family_reunion'
  | 'church'
  | 'military'
  | 'corporate'
  | 'memorial'
  | 'senior_night'
  | 'social'
  | 'unknown';

/** The four premium concepts (Design Bible Part 5). */
export type ConceptType =
  | 'Signature Edition'
  | 'Luxury Gold'
  | 'Family Legacy'
  | 'Modern Editorial';

export type Orientation = 'portrait' | 'landscape' | 'square';

export interface ColorSwatch {
  hex: string;
  /** Relative weight 0..1. */
  weight: number;
}

/**
 * Normalized photo descriptor. Analysis signals (faceCount, sharpness, …) are
 * OPTIONAL — supplied by an EXIF reader, canvas sampler, or a future vision
 * stage. The engine reads no pixels; missing signals degrade gracefully.
 */
export interface PhotoInput {
  id: string;
  filename?: string;
  width: number;
  height: number;
  bytes?: number;
  faceCount?: number;
  /** 0..1 */
  sharpness?: number;
  /** 0..1 mean luminance */
  brightness?: number;
  /** 0..1 */
  contrast?: number;
  dominantColors?: ColorSwatch[];
  /** ISO 8601 timestamp */
  takenAt?: string;
  /** Hex perceptual hash for duplicate detection */
  perceptualHash?: string;
  isMonochrome?: boolean;
}

export interface GenerateOptions {
  /** Occasion chosen in Experience Step 1. */
  occasion?: OccasionType;
}

export interface PhotoSummary {
  photoId: string;
  filename: string | null;
  orientation: Orientation;
  /** 0..100 composite score */
  score: number;
  faceCount: number;
  width: number;
  height: number;
}

export interface PhotoRanking {
  photoId: string;
  rank: number;
  compositeScore: number;
  role: 'hero' | 'supporting' | 'excluded';
}

export interface QualityScore {
  photoId: string;
  /** 0..100 */
  quality: number;
  /** 0..1 */
  resolutionScore: number;
  /** 0..1 */
  exposureScore: number;
  /** 0..1, or null when not supplied */
  sharpness: number | null;
}

export interface PrimarySubject {
  type: 'individual' | 'small_group' | 'group' | 'unknown';
  faceCount: number;
  sourcePhotoId: string | null;
}

export interface FamilyMember {
  id: string;
  label: string;
  photoIds: string[];
}

export interface PhotoGroup {
  label: string;
  photoIds: string[];
  size: number;
}

export interface DuplicateCandidate {
  group: string[];
  keep: string;
  reason: string;
}

export interface RestorationCandidate {
  photoId: string;
  reasons: string[];
}

export interface Warning {
  code: string;
  message: string;
  severity: 'info' | 'warning';
}

export interface FutureExtensionFields {
  faceRecognition: null;
  aiVision: null;
  expressionAnalysis: null;
  textDetection: null;
}

export interface MemoryProfile {
  schema_version: string;
  occasion: OccasionType;
  style: string;
  story: string;
  mood: string;
  primary_subject: PrimarySubject;
  hero_photo: PhotoSummary | null;
  supporting_photos: PhotoSummary[];
  photo_rankings: PhotoRanking[];
  family_members: FamilyMember[];
  groups: PhotoGroup[];
  dominant_colors: ColorSwatch[];
  photo_quality_scores: QualityScore[];
  face_count: number;
  portrait_count: number;
  landscape_count: number;
  /** Additive: not required by the schema doc but useful for completeness. */
  square_count: number;
  duplicate_candidates: DuplicateCandidate[];
  restoration_candidates: RestorationCandidate[];
  recommended_concept: ConceptType;
  confidence_score: number;
  warnings: Warning[];
  future_extension_fields: FutureExtensionFields;
}
