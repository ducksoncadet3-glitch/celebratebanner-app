/**
 * @celebratebanner/creative-brief
 *
 * The AI Creative Director's direction stage (WOW Engine, Sprint 2).
 *
 * Public API — ONE function:
 *   • generateCreativeBrief(memoryProfile, options?) → CreativeBrief
 *
 * The Creative Brief is the bridge:
 *   Memory Profile → Creative Brief → Four Concepts → WOW Score → Reveal UI
 *
 * Spec: docs/CREATIVE_BRIEF_SCHEMA.md · docs/WOW_ENGINE_PIPELINE.md
 */

export { generateCreativeBrief } from './engine.ts';
export { SCHEMA_VERSION } from './types.ts';
export type {
  CreativeBrief,
  GenerateBriefOptions,
  EmotionalDirection,
  MessageDirection,
  HeroStrategy,
  HeroDominance,
  SupportingPhotoStrategy,
  SupportingTierGroup,
  SupportingTier,
  ColorDirection,
  ColorRole,
  TypographyDirection,
  TypographyStyle,
  CompositionDirection,
  DecorativeDirection,
  ProductIntent,
  AudienceIntent,
  WowTargets,
  RiskWarning,
  ConceptType,
  OccasionType,
  MemoryProfile,
} from './types.ts';
