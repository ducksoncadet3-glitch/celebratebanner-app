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

export interface ProgressiveOptions extends RenderConceptOptions {
  /**
   * Per-concept time budget in ms. A concept that renders slower than this is
   * downgraded to a placeholder fallback (rendering is synchronous, so this is a
   * post-hoc guard, not a preemption) — it never blocks the reveal.
   */
  perConceptTimeoutMs?: number;
  /** Called after each concept resolves, for a progress indicator. */
  onProgress?: (done: number, total: number, preview: ConceptPreview) => void;
  /** Yields control to the event loop between concepts (rAF/idle in the browser). */
  scheduleYield?: () => Promise<void>;
  /** Monotonic clock (performance.now in the browser; injectable for tests). */
  now?: () => number;
}

/**
 * Render the four concepts ONE AT A TIME, yielding to the event loop between each so
 * the UI stays responsive and a progress indicator can paint. A concept that blows
 * its per-concept time budget is shown as a placeholder fallback. Never throws.
 */
export async function renderConceptPreviewsProgressive(
  result: PipelineResult,
  renderer: Renderer,
  options: ProgressiveOptions = {},
): Promise<ConceptPreview[]> {
  const concepts = result.wowPresentation.concepts;
  const total = concepts.length;
  const now = options.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  const scheduleYield = options.scheduleYield ?? (() => Promise.resolve());
  const budget = options.perConceptTimeoutMs ?? Infinity;
  const { perConceptTimeoutMs: _t, onProgress: _p, scheduleYield: _y, now: _n, ...renderOptions } = options;

  const out: ConceptPreview[] = [];
  for (let i = 0; i < total; i++) {
    await scheduleYield(); // let the browser paint the previous result / handle input
    const t0 = now();
    let preview = renderConceptPreview(result, concepts[i].conceptName, renderer, renderOptions);
    const elapsed = now() - t0;
    if (preview.status === 'rendered' && elapsed > budget) {
      preview = {
        ...preview,
        status: 'fallback',
        previewUri: null,
        thumbnailUri: null,
        reasons: [`Render exceeded the ${budget}ms budget (${Math.round(elapsed)}ms) — showing placeholder.`],
      };
    }
    out.push(preview);
    options.onProgress?.(i + 1, total, preview);
  }
  return out;
}
