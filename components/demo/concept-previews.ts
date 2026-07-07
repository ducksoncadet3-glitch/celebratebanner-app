/**
 * Concept-preview orchestration (Sprint 8) — pure, DOM-free, and testable.
 *
 * For each of the four WOW concepts it re-plans (renderPlanForConcept) and drives the
 * Render Adapter with an INJECTED renderer, then classifies the outcome:
 *
 *   • rendered — the renderer produced a preview image (real artwork shown).
 *   • fallback — rendering did NOT complete (the renderer failed / produced no image
 *                / the plan was rejected); we degrade gracefully to the placeholder.
 *   • failed   — the concept could not even be planned (an upstream error); placeholder.
 *
 * It makes no creative decisions and draws no pixels itself — the injected renderer
 * (the canvas binding in the browser, a fake in tests) owns rendering. Keeping this
 * layer DOM-free is what lets the render/fallback/failed logic be unit-tested.
 */
import { renderConcept } from '../../shared/render-adapter/src/index.ts';
import type { Renderer, RenderConceptOptions, RenderedConcept } from '../../shared/render-adapter/src/index.ts';
import { renderPlanForConcept } from './pipeline.ts';
import type { PipelineResult, WowConceptName } from './pipeline.ts';

export type PreviewStatus = 'rendered' | 'fallback' | 'failed';

export interface ConceptPreview {
  conceptName: WowConceptName;
  status: PreviewStatus;
  previewUri: string | null;
  thumbnailUri: string | null;
  renderStatus: RenderedConcept['renderStatus'] | 'error';
  renderTime: number;
  reasons: string[];
}

const msg = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/** Render (or fall back for) a single concept. Never throws. */
export function renderConceptPreview(
  result: PipelineResult,
  conceptName: WowConceptName,
  renderer: Renderer,
  options: RenderConceptOptions = {},
): ConceptPreview {
  // Upstream planning failure → 'failed' (we can't even ask the renderer).
  let plan;
  try {
    plan = renderPlanForConcept(result, conceptName);
  } catch (err) {
    return { conceptName, status: 'failed', previewUri: null, thumbnailUri: null, renderStatus: 'error', renderTime: 0, reasons: [msg(err)] };
  }

  try {
    const rc = renderConcept(plan, renderer, options);
    if (rc.renderStatus === 'completed' && rc.previewImage && rc.previewImage.uri) {
      return {
        conceptName,
        status: 'rendered',
        previewUri: rc.previewImage.uri,
        thumbnailUri: rc.thumbnailImage?.uri ?? null,
        renderStatus: rc.renderStatus,
        renderTime: rc.renderTime,
        reasons: [],
      };
    }
    // Rendering did not complete (renderer failed / no image / plan rejected) → placeholder.
    return {
      conceptName,
      status: 'fallback',
      previewUri: null,
      thumbnailUri: null,
      renderStatus: rc.renderStatus,
      renderTime: rc.renderTime,
      reasons: rc.qualityChecks.reasons,
    };
  } catch (err) {
    // Unexpected error inside the adapter → still degrade gracefully.
    return { conceptName, status: 'fallback', previewUri: null, thumbnailUri: null, renderStatus: 'error', renderTime: 0, reasons: [msg(err)] };
  }
}

/** Render previews for all four concepts in the presentation. */
export function renderAllConceptPreviews(
  result: PipelineResult,
  renderer: Renderer,
  options: RenderConceptOptions = {},
): ConceptPreview[] {
  return result.wowPresentation.concepts.map((c) => renderConceptPreview(result, c.conceptName, renderer, options));
}
