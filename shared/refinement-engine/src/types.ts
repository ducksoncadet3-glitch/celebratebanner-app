/**
 * @celebratebanner/refinement-engine — types
 *
 * Lets a customer refine ONE already-approved WOW concept with a natural-language
 * request ("make it more luxurious", "bigger hero", "warmer colors"). The engine
 * parses the request into intents, applies bounded, rule-based edits to the concept's
 * creative recipes, RECALCULATES the WOW Score, and re-gates at 90.
 *
 * It never invents facts, never fabricates people, never changes customer names,
 * never reorders memories without justification, never reduces hero dominance, and
 * never ships clutter or a sub-90 result. Deterministic, pixel-free, dependency-free.
 *
 * Governed by: docs/CREATIVE_CONSTITUTION.md · docs/CELEBRATEBANNER_DESIGN_BIBLE.md
 */
import type { WowConcept, WowConceptName, WowScoreBreakdown, CreativeBrief, MemoryProfile } from '../../wow-engine/src/types.ts';

export type { WowConcept, WowConceptName, WowScoreBreakdown, CreativeBrief, MemoryProfile };

export const SCHEMA_VERSION = '1.0.0';

/** The WOW Score gate — a refinement is accepted only at or above this. */
export const WOW_THRESHOLD = 90;

/** Category maxima of the 100-point rubric (Design Bible Part 7). */
export const SCORE_MAX = {
  heroStrength: 15,
  emotionalImpact: 20,
  storytelling: 15,
  layoutBalance: 15,
  typography: 10,
  colorHarmony: 10,
  luxuryFinish: 10,
  shareability: 5,
} as const;
export type ScoreCategory = keyof typeof SCORE_MAX;

/** The fourteen supported refinement intents. */
export const REFINEMENT_INTENTS = [
  'luxury', 'elegance', 'modern', 'classic', 'minimal', 'celebration',
  'hero-emphasis', 'typography', 'color', 'decoration', 'lighting', 'emotion',
  'background', 'energy',
] as const;
export type RefinementIntent = (typeof REFINEMENT_INTENTS)[number];

/** A forbidden request the Constitution refuses to honor. */
export interface ForbiddenRequest {
  code: 'reduce-hero' | 'change-name' | 'fabricate' | 'change-identity' | 'reorder-memories';
  reason: string;
}

export interface ParsedInstruction {
  intents: RefinementIntent[];
  forbidden: ForbiddenRequest[];
  /** Terms that triggered each intent (for transparency/tests). */
  matchedTerms: Partial<Record<RefinementIntent, string[]>>;
}

export interface FieldChange {
  field: string;
  from: string;
  to: string;
}

export interface AppliedRefinement {
  intent: RefinementIntent;
  label: string;
  summary: string;
  scoreDelta: Partial<Record<ScoreCategory, number>>;
  changes: FieldChange[];
}

/** The Creative Constitution / Design Bible checks every refinement must pass. */
export interface ConstitutionChecks {
  wowScorePassed: boolean;
  heroDominancePreserved: boolean;
  namesUnchanged: boolean;
  noFabrication: boolean;
  memoriesOrderPreserved: boolean;
  clutterAvoided: boolean;
  reasons: string[];
}

export interface RefinedConcept {
  schemaVersion: string;
  conceptName: WowConceptName;
  instruction: string;
  accepted: boolean;
  intents: RefinementIntent[];
  appliedRefinements: AppliedRefinement[];
  /** The refined concept when accepted; the ORIGINAL, untouched concept when rejected. */
  concept: WowConcept;
  previousWowScore: number;
  wowScore: number;
  /** The recomputed score of the attempted refinement (may be < 90 on a score rejection); null if nothing was applied. */
  attemptedScore: number | null;
  scoreBreakdown: WowScoreBreakdown;
  masterpiecePassed: boolean;
  rejectionReasons: string[];
  changeLog: string[];
  constitution: ConstitutionChecks;
}

export interface RefineOptions {
  /** Max simultaneous intents before the request is refused as over-refinement. Default 3. */
  maxIntents?: number;
  /** Highest hero dominance a refinement may raise to. Default 0.8. */
  maxHeroDominance?: number;
}
