/**
 * @celebratebanner/render-orchestrator — types
 *
 * Turns the WOW Engine's decisions into a renderer-ready RenderPlan. The
 * WOW Engine DECIDES; the orchestrator TRANSLATES; the renderer EXECUTES.
 * No creative decisions are made here, and no pixels are produced.
 *
 * Spec: docs/WOW_ENGINE_SPECIFICATION.md · docs/CELEBRATEBANNER_DESIGN_BIBLE.md
 */

// Upstream inputs (read-only; never mutated).
import type { MemoryProfile } from '../../memory-profile/src/types.ts';
import type { CreativeBrief } from '../../creative-brief/src/types.ts';
import type {
  WowPresentation, WowConcept, WowConceptName, PhotoSummary,
  LayoutRecipe, ColorRecipe, TypographyRecipe,
} from '../../wow-engine/src/types.ts';

export type {
  MemoryProfile, CreativeBrief, WowPresentation, WowConcept, WowConceptName,
  PhotoSummary, LayoutRecipe, ColorRecipe, TypographyRecipe,
};

export const SCHEMA_VERSION = '1.0.0';
export const WOW_THRESHOLD = 90;

/** The production renderer's real arrangement vocabulary (index.html). */
export type ArrangementId = 'classic' | 'magazine' | 'mosaic' | 'pyramid';

// ── Render instructions (WHAT the renderer draws; no creative choices) ────────

export interface HeroPlacement {
  zone: string;              // e.g. 'center', 'left', 'apex-top'
  dominanceRatio: number;    // 0–1 fractional visual weight (from the WOW concept)
  frame: string;             // e.g. 'thin-gold', 'gold', 'soft', 'minimal'
  spotlight: boolean;
  protectFace: boolean;      // Design Bible face-safety — always true
}

export interface SupportingPlacement {
  arrangement: ArrangementId;
  maxCells: number;          // from the layout recipe
  count: number;             // actual supporting photos placed (≤ maxCells)
  gapRatio: number;
  treatment: string;         // e.g. 'unified grade, lead the eye back to hero'
}

export interface TypographyPlacement {
  titleZone: string;
  subtitleZone: string;
  alignment: string;         // 'center' | 'left'
  displayFont: string;
  supportingFont: string;
  headlineTreatment: string;
  labelTreatment: string;
}

export interface BackgroundSelection {
  style: string;             // e.g. 'obsidian-gradient', 'obsidian-gold-glow'
  decorationTheme: string;   // renderer theme-decoration key (occasion-derived)
  vignette: boolean;
}

export interface ColorPaletteInstruction {
  ground: string;
  accent: string;
  neutral: string;
  palette: { hex: string; role: string }[];
  source: 'photos' | 'occasion-default';
}

export interface SpacingSpec {
  marginRatio: number;       // fraction of the short canvas edge
  gapRatio: number;
  whitespace: string;        // descriptor carried from the brief
}

export interface LayeringSpec {
  /** Bottom → top draw order. */
  order: string[];
}

export interface RenderInstructions {
  arrangement: ArrangementId;
  heroPlacement: HeroPlacement;
  supportingPlacement: SupportingPlacement;
  typographyPlacement: TypographyPlacement;
  backgroundSelection: BackgroundSelection;
  colorPalette: ColorPaletteInstruction;
  decorativeElements: string[];
  spacing: SpacingSpec;
  layering: LayeringSpec;
}

// ── Export targets (specs only — no pixels) ───────────────────────────────────

export type ExportTargetId = 'digital' | 'poster_18x24' | 'poster_24x36' | 'framed_24x36';

export interface ExportTarget {
  id: ExportTargetId;
  label: string;
  product: string;
  widthIn: number;
  heightIn: number;
  dpi: number;
  widthPx: number;
  heightPx: number;
  bleedIn: number;
  safeMarginIn: number;
  colorMode: 'CMYK' | 'RGB';
  formats: string[];
  orientation: 'portrait' | 'landscape' | 'square';
  framed: boolean;
  matte: boolean;
  note: string;
}

// ── Quality validation ────────────────────────────────────────────────────────

export interface QualityChecks {
  passed: boolean;
  heroPhoto: boolean;
  supportingPhotos: boolean;
  wowScore: boolean;
  masterpiecePassed: boolean;
  layoutRecipeComplete: boolean;
  typographyRecipeComplete: boolean;
  exportTargetsDefined: boolean;
  reasons: string[];
}

// ── The plan ──────────────────────────────────────────────────────────────────

export interface RenderPlan {
  schemaVersion: string;
  version: string;
  createdAt: string | null;
  occasion: string;
  conceptName: WowConceptName;
  /** True only when every quality check passes (mirror of qualityChecks.passed). */
  accepted: boolean;
  heroPhoto: PhotoSummary | null;
  supportingPhotos: PhotoSummary[];
  layoutRecipe: LayoutRecipe;
  colorRecipe: ColorRecipe;
  typographyRecipe: TypographyRecipe;
  renderInstructions: RenderInstructions;
  exportTargets: ExportTarget[];
  qualityChecks: QualityChecks;
}

export interface GenerateRenderPlanOptions {
  /** Which concept to plan for. Defaults to the presentation's recommendedConcept. */
  conceptName?: WowConceptName;
  /** ISO timestamp for createdAt; omit to stay deterministic (null). */
  now?: string | null;
}
