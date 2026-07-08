/**
 * Integration-demo pipeline (Sprint 6).
 *
 * Composes the real CelebrateBanner 2.0 engines end-to-end, live:
 *
 *   Memory Profile → Creative Brief → WOW Engine → Render Orchestrator
 *
 * Pure logic (no DOM, no fs, deterministic) so it can be unit-tested and bundled
 * into the browser demo alike. It only orchestrates the shared modules — it makes
 * no creative decisions of its own.
 */
import { generateCreativeBrief } from '../../shared/creative-brief/src/index.ts';
import { generateWOWPresentation } from '../../shared/wow-engine/src/index.ts';
import { generateRenderPlan } from '../../shared/render-orchestrator/src/index.ts';
import { directArt } from '../../shared/art-direction-engine/src/index.ts';
import type { ArtDirectionResult, ArtDirection } from '../../shared/art-direction-engine/src/index.ts';

import type { MemoryProfile } from '../../shared/memory-profile/src/types.ts';
import type { CreativeBrief } from '../../shared/creative-brief/src/types.ts';
import type { WowPresentation, WowConcept, WowConceptName } from '../../shared/wow-engine/src/types.ts';
import type { RenderPlan } from '../../shared/render-orchestrator/src/types.ts';

export type { MemoryProfile, CreativeBrief, WowPresentation, WowConcept, WowConceptName, RenderPlan, ArtDirectionResult, ArtDirection };

export interface PipelineResult {
  memoryProfile: MemoryProfile;
  creativeBrief: CreativeBrief;
  /** The ART-DIRECTED presentation — the art director re-recipes each concept. */
  wowPresentation: WowPresentation;
  /** The art director's per-concept brief (copy + treatment + story). */
  artDirection: ArtDirectionResult;
  renderPlan: RenderPlan; // for the recommended (Director's Choice) concept
}

/**
 * Run the full chain from a Memory Profile through to a Render Plan.
 *
 *   Memory Profile → Creative Brief → WOW Engine → Art Direction Engine
 *     → Render Orchestrator → (Render Adapter → Renderer, downstream)
 *
 * The Art Director re-recipes each concept (palette, hero emphasis, whitespace,
 * supporting rhythm, story order); the untouched orchestrator then translates that
 * direction into renderer instructions.
 */
export function runPipeline(memoryProfile: MemoryProfile): PipelineResult {
  const creativeBrief = generateCreativeBrief(memoryProfile);
  const rawPresentation = generateWOWPresentation(memoryProfile, creativeBrief);
  const artDirection = directArt(memoryProfile, creativeBrief, rawPresentation);
  const wowPresentation = artDirection.presentation;
  const renderPlan = generateRenderPlan(memoryProfile, creativeBrief, wowPresentation);
  return { memoryProfile, creativeBrief, wowPresentation, artDirection, renderPlan };
}

/** Re-plan for a specific concept (used when the customer inspects a card). */
export function renderPlanForConcept(result: PipelineResult, conceptName: WowConceptName): RenderPlan {
  return generateRenderPlan(result.memoryProfile, result.creativeBrief, result.wowPresentation, { conceptName });
}
