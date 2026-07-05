/**
 * @celebratebanner/creative-brief — type definitions
 *
 * The Creative Brief decides HOW the celebration story should be told. It is the
 * bridge: Memory Profile → Creative Brief → Four Concepts → WOW Score → Reveal.
 *
 * See docs/CREATIVE_BRIEF_SCHEMA.md for the authoritative field reference.
 */

import type { ConceptType, OccasionType } from '../../memory-profile/src/types.ts';

export const SCHEMA_VERSION = '1.0.0';

// Re-export the shared vocabulary so consumers import from one place.
export type { ConceptType, OccasionType } from '../../memory-profile/src/types.ts';
export type { MemoryProfile } from '../../memory-profile/src/types.ts';

export interface GenerateBriefOptions {
  /** ISO timestamp to stamp `createdAt`. Omit to keep output deterministic. */
  now?: string | null;
}

export interface EmotionalDirection {
  primary: string;
  keywords: string[];
  statement: string;
}

export interface MessageDirection {
  suggestion: string;
  guidance: string;
}

export type HeroDominance = 'commanding' | 'strong' | 'balanced';

export interface HeroStrategy {
  heroPhotoId: string | null;
  rationale: string;
  dominance: HeroDominance;
  /** Fractional visual weight, 0..1. */
  dominanceRatio: number;
  supportingRole: string;
}

export type SupportingTier = 'emotional_anchor' | 'story_builder' | 'accent';

export interface SupportingTierGroup {
  tier: SupportingTier;
  photoIds: string[];
  role: string;
}

export interface SupportingPhotoStrategy {
  hierarchy: SupportingTierGroup[];
  maxRecommended: number;
  guidance: string;
}

export interface ColorRole {
  hex: string;
  role: string;
}

export interface ColorDirection {
  palette: ColorRole[];
  primary: string;
  accent: string;
  neutral: string;
  source: 'photos' | 'occasion-default';
  guidance: string;
}

export type TypographyStyle = 'elegant' | 'bold' | 'editorial' | 'legacy' | 'respectful';

export interface TypographyDirection {
  style: TypographyStyle;
  displayFont: string;
  supportingFont: string;
  guidance: string;
}

export interface CompositionDirection {
  layout: string;
  balance: string;
  whitespace: string;
  guidance: string;
}

export interface DecorativeDirection {
  allowed: string[];
  forbidden: string[];
  guidance: string;
}

export interface ProductIntent {
  recommendedProducts: string[];
  primaryProduct: string;
  guidance: string;
}

export interface AudienceIntent {
  primaryAudience: string;
  sharingContext: string;
  guidance: string;
}

export interface WowTargets {
  overallTarget: number;
  emphasis: string[];
  guidance: string;
}

export interface RiskWarning {
  code: string;
  message: string;
  severity: 'info' | 'warning';
}

export interface CreativeBrief {
  schemaVersion: string;
  briefId: string;
  createdAt: string | null;
  occasion: OccasionType;
  recommendedConcept: ConceptType;
  emotionalDirection: EmotionalDirection;
  storyAngle: string;
  primaryMessage: MessageDirection;
  secondaryMessage: MessageDirection;
  heroStrategy: HeroStrategy;
  supportingPhotoStrategy: SupportingPhotoStrategy;
  colorDirection: ColorDirection;
  typographyDirection: TypographyDirection;
  compositionDirection: CompositionDirection;
  decorativeDirection: DecorativeDirection;
  productIntent: ProductIntent;
  audienceIntent: AudienceIntent;
  personalizationSuggestions: string[];
  upsellOpportunities: string[];
  wowTargets: WowTargets;
  riskWarnings: RiskWarning[];
  confidenceScore: number;
}
