/**
 * @celebratebanner/art-direction-engine — types
 *
 * The Art Direction Engine is the creative director. It sits between the WOW Engine
 * (which chooses the four concepts) and the Render Orchestrator (which translates a
 * concept into renderer instructions):
 *
 *   Memory Profile → Creative Brief → WOW Engine → **Art Direction Engine**
 *     → Render Orchestrator → Render Adapter → Renderer
 *
 * It DECIDES: composition philosophy, visual hierarchy, whitespace strategy, hero
 * emphasis, supporting rhythm, typography hierarchy, luxury level, emotional intensity,
 * framing style, and storytelling flow. The renderer still EXECUTES.
 *
 * Deterministic and pixel-free. It never invents facts, never fabricates people, and
 * never reorders memories without recording the narrative justification.
 */
import type { WowConcept, WowConceptName, WowPresentation, PhotoSummary, CreativeBrief, MemoryProfile } from '../../wow-engine/src/types.ts';

export type { WowConcept, WowConceptName, WowPresentation, PhotoSummary, CreativeBrief, MemoryProfile };

export const SCHEMA_VERSION = '1.0.0';

/** The hero must command the frame — never below 55%, never a caricature above 70%. */
export const HERO_DOMINANCE_FLOOR = 0.55;
export const HERO_DOMINANCE_CEILING = 0.70;

export type Balance = 'symmetrical' | 'asymmetrical' | 'layered' | 'editorial';
export type WhitespaceLevel = 'controlled' | 'generous' | 'expansive' | 'dramatic';
export type FramingStyle = 'museum' | 'editorial' | 'intimate' | 'cinematic';
export type Cadence = 'even' | 'crescendo' | 'journey' | 'sparse';

export interface CompositionPhilosophy {
  /** The one-line creative thesis for this identity. */
  thesis: string;
  balance: Balance;
  /** Ordered visual hierarchy — what the eye should meet, in order. */
  visualHierarchy: string[];
  focalPath: string;
}

export interface WhitespaceStrategy {
  level: WhitespaceLevel;
  marginRatio: number;
  gutterRatio: number;
  rationale: string;
}

export interface HeroEmphasis {
  /** 0.55–0.70 — the share of visual attention the hero must command. */
  dominanceRatio: number;
  framing: FramingStyle;
  spotlight: boolean;
  cinematic: boolean;
  frame: string;
  /** Dead space is forbidden: the hero is always cropped to fill its frame. */
  fillsFrame: true;
}

export interface SupportingRhythm {
  /** How many supporting photos this identity shows. */
  count: number;
  cadence: Cadence;
  /** Aspect every supporting tile is cropped to — one disciplined shape. */
  aspect: number;
  gapRatio: number;
  rationale: string;
}

export interface TypographyHierarchy {
  style: string;
  displayFont: string;
  supportingFont: string;
  /** Display size relative to the base scale. */
  displayScale: number;
  tracking: string;
  casing: 'title' | 'upper';
  alignment: 'center' | 'left';
  headlineTreatment: string;
  labelTreatment: string;
}

export interface ArtPalette {
  ground: string;
  accent: string;
  neutral: string;
  rationale: string;
}

/** What the render binding must execute to realise this identity. */
export interface RenderTreatment {
  grade: { contrast: number; saturate: number; brightness: number };
  /** 0–1 vignette strength applied to supporting tiles. */
  vignette: number;
  heroFrame: string;
  supportingAspect: number;
  cinematicHero: boolean;
}

/** Customer-facing card copy. Design facts only — never invented biography. */
export interface ConceptCopy {
  title: string;
  /** Exactly one emotional sentence. */
  emotionalSentence: string;
  /** Exactly three premium bullet points. */
  bullets: [string, string, string];
}

/** One narrative beat in the photo story. */
export interface StoryBeat {
  photoId: string;
  beat: string;
  /** Why this photo sits at this point in the story — never silent reordering. */
  reason: string;
}

export interface ArtDirection {
  conceptName: WowConceptName;
  philosophy: CompositionPhilosophy;
  whitespace: WhitespaceStrategy;
  hero: HeroEmphasis;
  supporting: SupportingRhythm;
  typography: TypographyHierarchy;
  palette: ArtPalette;
  /** 0–100. */
  luxuryLevel: number;
  /** 0–100. */
  emotionalIntensity: number;
  framingStyle: FramingStyle;
  /** The ordered narrative the supporting photos tell. */
  storytellingFlow: StoryBeat[];
  treatment: RenderTreatment;
  copy: ConceptCopy;
}

export interface ArtDirectionResult {
  schemaVersion: string;
  occasion: string;
  directions: ArtDirection[];
  /** The WOW presentation, re-recipe'd by the art director. Same concepts, new direction. */
  presentation: WowPresentation;
}

export interface DirectArtOptions {
  /** Override the storytelling beats for an occasion (tests / future occasions). */
  beats?: string[];
}
