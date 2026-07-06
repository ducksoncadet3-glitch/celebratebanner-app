/**
 * @celebratebanner/wow-engine — types
 *
 * The WOW Engine consumes a Memory Profile + Creative Brief and produces a
 * WOWPresentation: four art-directed premium concepts with creative decisions
 * and WOW Scores. It decides WHAT to show — never HOW to paint it (no pixels).
 *
 * Spec: docs/WOW_ENGINE_SPECIFICATION.md · docs/WOW_ENGINE_PIPELINE.md ·
 *       docs/CELEBRATEBANNER_DESIGN_BIBLE.md (Part 5 concepts, Part 7 WOW Score)
 */

// Inputs — the real upstream schemas (read-only, never mutated).
import type { MemoryProfile, PhotoSummary, OccasionType } from '../../memory-profile/src/types.ts';
import type { CreativeBrief, ConceptType } from '../../creative-brief/src/types.ts';

export type { MemoryProfile, PhotoSummary, OccasionType, CreativeBrief, ConceptType };

/** The four premium concepts, in canonical reveal order (Design Bible Part 5). */
export const CONCEPT_ORDER = [
  'Signature Edition',
  'Luxury Gold',
  'Family Legacy',
  'Modern Editorial',
] as const;

export type WowConceptName = (typeof CONCEPT_ORDER)[number];

export const SCHEMA_VERSION = '1.0.0';

/** The WOW Score gate — a concept is a masterpiece only at or above this. */
export const WOW_THRESHOLD = 90;

// ── Creative recipes (decisions only — abstract instructions, no pixels) ──────

/** WHAT the layout should be. The renderer decides HOW to paint it. */
export interface LayoutRecipe {
  arrangement: string;
  heroPlacement: string;
  heroDominanceRatio: number; // 0–1 fractional visual weight of the hero
  supportingLayout: string;
  balance: string;
  whitespace: string;
  focalPath: string;
  maxSupporting: number;
}

export interface ColorRoleRecipe {
  hex: string;
  role: string;
}

export interface ColorRecipe {
  ground: string;
  accent: string;
  neutral: string;
  palette: ColorRoleRecipe[];
  source: 'photos' | 'occasion-default';
  guidance: string;
}

export interface TypographyRecipe {
  style: string;
  displayFont: string;
  supportingFont: string;
  headlineTreatment: string;
  labelTreatment: string;
  guidance: string;
}

/** Pre-written, in-voice share copy — text only, never an image. */
export interface SharePreview {
  headline: string;
  caption: string;
  altText: string;
}

// ── WOW Score ─────────────────────────────────────────────────────────────────

/** The 100-point rubric (Design Bible Part 7). */
export interface WowScoreBreakdown {
  heroStrength: number;    // /15
  emotionalImpact: number; // /20
  storytelling: number;    // /15
  layoutBalance: number;   // /15
  typography: number;      // /10
  colorHarmony: number;    // /10
  luxuryFinish: number;    // /10
  shareability: number;    // /5
  total: number;           // /100
}

// ── A single concept ──────────────────────────────────────────────────────────

export interface WowConcept {
  conceptName: WowConceptName;
  title: string;
  subtitle: string;
  /** WHY the AI made its decisions — derived from profile + brief, never invented. */
  creativeExplanation: string;
  /** Gentle purchase guidance (guide, never manipulate). */
  purchasePsychology: string;
  heroPhoto: PhotoSummary | null;
  supportingPhotos: PhotoSummary[];
  layoutRecipe: LayoutRecipe;
  colorRecipe: ColorRecipe;
  typographyRecipe: TypographyRecipe;
  recommendedProduct: string;
  sharePreview: SharePreview;
  wowScore: number;
  masterpiecePassed: boolean;
  // Additive detail (never removes required fields):
  scoreBreakdown: WowScoreBreakdown;
  failureReasons: string[];
}

// ── The presentation ───────────────────────────────────────────────────────────

export interface WowPresentation {
  schemaVersion: string;
  version: string;
  createdAt: string | null; // null in the pure engine; caller stamps via options.now
  occasion: OccasionType;
  recommendedConcept: ConceptType;
  masterpiecePassed: boolean; // true only if ALL four concepts clear the gate
  overallWOWScore: number;
  concepts: WowConcept[];
}

export interface GenerateWOWOptions {
  now?: string | null;
}
