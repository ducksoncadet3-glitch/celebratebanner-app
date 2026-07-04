/**
 * @celebratebanner/memory-profile
 *
 * The AI Creative Director's analysis stage (WOW Engine, Sprint 1).
 *
 * Public API — ONE function:
 *   • generateMemoryProfile(uploadedPhotos, options?) → MemoryProfile
 *
 * The MemoryProfile is the single source of truth for every downstream system.
 * No renderer inspects raw photos directly.
 *
 * Spec: docs/MEMORY_PROFILE_SCHEMA.md · docs/WOW_ENGINE_PIPELINE.md
 */

export { generateMemoryProfile } from './engine.ts';
export { SCHEMA_VERSION } from './types.ts';
export type {
  OccasionType,
  ConceptType,
  Orientation,
  ColorSwatch,
  PhotoInput,
  GenerateOptions,
  PhotoSummary,
  PhotoRanking,
  QualityScore,
  PrimarySubject,
  FamilyMember,
  PhotoGroup,
  DuplicateCandidate,
  RestorationCandidate,
  Warning,
  FutureExtensionFields,
  MemoryProfile,
} from './types.ts';
