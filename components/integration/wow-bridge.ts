/**
 * WOW bridge (Sprint 9) — the seam between the production builder's state and the
 * CelebrateBanner 2.0 pipeline. Pure and DOM-free so it is fully unit-testable; the
 * browser glue (wow-bridge.entry.ts) mounts the result.
 *
 *   builder state → Memory Profile → Creative Brief → WOW Engine →
 *   Render Orchestrator → Render Adapter → (injected renderer) → concept previews
 *
 * Everything here runs ONLY behind the private ?wow=1 flag; nothing in this module is
 * wired into the default customer path. It changes no pricing, checkout, or renderer
 * behavior — it only reads builder state and composes the existing engines.
 */
import { generateMemoryProfile } from '../../shared/memory-profile/src/index.ts';
import type { MemoryProfile, PhotoInput, OccasionType } from '../../shared/memory-profile/src/index.ts';
import { runPipeline } from '../demo/pipeline.ts';
import type { PipelineResult } from '../demo/pipeline.ts';
import { renderAllConceptPreviews } from '../demo/concept-previews.ts';
import type { ConceptPreview } from '../demo/concept-previews.ts';
import type { Renderer, RenderConceptOptions } from '../../shared/render-adapter/src/index.ts';

/** The subset of the builder's `state` object the bridge reads (loosely typed). */
export interface BuilderPhoto {
  id: string;
  name?: string;
  w: number;
  h: number;
  /** The real <img> element (browser only); ignored by the pure core. */
  imgEl?: unknown;
  [k: string]: unknown;
}
export interface BuilderState {
  images?: BuilderPhoto[];
  heroImage?: string | null;
  theme?: { id?: string } | null;
  bannerText?: Record<string, string>;
  /** Set by selectConcept when a customer loves a concept. */
  wowSelectedConcept?: string | null;
  [k: string]: unknown;
}

// Builder theme id → pipeline occasion. Unknown themes degrade to 'unknown' (handled).
const THEME_OCCASION: Record<string, OccasionType> = {
  graduation: 'graduation',
  champion: 'championship',
  worldcup2026: 'championship',
  wedding: 'wedding',
  anniversary: 'unknown',
  pets: 'unknown',
  america250: 'unknown',
};

/** True when the private WOW flag (?wow=1) is present in a location search string. */
export function isWOWMode(search = ''): boolean {
  try {
    return /(?:^|[?&])wow=1(?:&|$)/.test(String(search || ''));
  } catch {
    return false;
  }
}

export function occasionForTheme(themeId?: string | null): OccasionType {
  return (themeId && THEME_OCCASION[themeId]) || 'unknown';
}

/**
 * Optional per-photo signal enricher. The browser supplies genuinely pixel-derived
 * signals (sharpness / brightness / contrast sampled from the upload); omitting it
 * leaves the engine's neutral defaults. Never fabricates data it cannot measure.
 */
export type PhotoEnricher = (photo: BuilderPhoto) => Partial<PhotoInput>;

/** Translate builder photo state into pixel-free PhotoInputs for the analysis stage. */
export function photoInputsFromState(state: BuilderState, enrich?: PhotoEnricher): PhotoInput[] {
  const imgs = Array.isArray(state.images) ? state.images : [];
  return imgs
    .filter((p) => p && Number(p.w) > 0 && Number(p.h) > 0)
    .map((p) => {
      const base: PhotoInput = { id: String(p.id), filename: p.name ?? undefined, width: Number(p.w), height: Number(p.h) };
      return enrich ? { ...base, ...enrich(p) } : base;
    });
}

/** Build a Memory Profile from the current builder state. */
export function buildMemoryProfile(state: BuilderState, enrich?: PhotoEnricher): MemoryProfile {
  return generateMemoryProfile(photoInputsFromState(state, enrich), { occasion: occasionForTheme(state.theme?.id) });
}

export interface WowRunOptions extends RenderConceptOptions {
  /** Per-photo signal enricher (browser canvas sampler). */
  enrich?: PhotoEnricher;
}

export interface WowRunResult {
  memoryProfile: MemoryProfile;
  pipeline: PipelineResult;
  previews: ConceptPreview[];
}

/**
 * Run the full pipeline for the current builder state and render concept previews
 * with the injected renderer. May throw (e.g. no photos) — callers that must never
 * block the customer should use safeRunWowPipeline instead.
 */
export function runWowPipeline(state: BuilderState, renderer: Renderer, options?: WowRunOptions): WowRunResult {
  const { enrich, ...renderOptions } = options ?? {};
  const memoryProfile = buildMemoryProfile(state, enrich);
  const pipeline = runPipeline(memoryProfile);
  const previews = renderAllConceptPreviews(pipeline, renderer, { renderExports: false, ...renderOptions });
  return { memoryProfile, pipeline, previews };
}

export type WowOutcome = { ok: true; result: WowRunResult } | { ok: false; error: string };

/** runWowPipeline wrapped so it NEVER throws — the customer path must never break. */
export function safeRunWowPipeline(state: BuilderState, renderer: Renderer, options?: WowRunOptions): WowOutcome {
  try {
    if (!Array.isArray(state.images) || state.images.length === 0) {
      throw new Error('WOW pipeline skipped: no uploaded photos.');
    }
    return { ok: true, result: runWowPipeline(state, renderer, options) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Record the customer's chosen concept in builder state. Deliberately touches ONLY
 * `wowSelectedConcept` — it does not alter pricing, package, delivery, or checkout.
 */
export function selectConcept(state: BuilderState, conceptName: string): void {
  state.wowSelectedConcept = conceptName;
}
