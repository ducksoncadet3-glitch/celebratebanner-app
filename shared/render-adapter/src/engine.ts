/**
 * The render adapter — public entry point.
 *
 *   renderConcept(renderPlan, renderer, options?) → RenderedConcept
 *
 * Translates a RenderPlan into renderer-ready requests, invokes the INJECTED
 * renderer for the preview, thumbnail, and every export target, then packages and
 * validates the result. Makes no creative decisions. Embeds no pixels. Deterministic
 * given a deterministic renderer (the adapter itself uses no Date/random/I-O).
 *
 * A plan that the orchestrator did not accept is NOT rendered: renderConcept returns
 * a `skipped` result and never touches the renderer.
 */
import type {
  RenderPlan, Renderer, RenderedConcept, RenderedExportTarget, RenderedImage,
  RenderStatus, RenderConceptOptions,
} from './types.ts';
import { SCHEMA_VERSION } from './types.ts';
import { buildRenderRequest } from './mapper.ts';
import { validateRendered, imageValid } from './validator.ts';

export function renderConcept(
  renderPlan: RenderPlan,
  renderer: Renderer,
  options: RenderConceptOptions = {},
): RenderedConcept {
  const arrangement = renderPlan.renderInstructions.arrangement;
  const base = {
    schemaVersion: SCHEMA_VERSION,
    conceptName: renderPlan.conceptName,
    occasion: renderPlan.occasion,
    arrangement,
  };

  // Never render a rejected plan — skip cleanly and report why.
  if (!renderPlan.accepted) {
    return {
      ...base,
      renderStatus: 'skipped',
      renderTime: 0,
      previewImage: null,
      thumbnailImage: null,
      exportTargets: [],
      qualityChecks: validateRendered(renderPlan, null, null, [], 'skipped'),
    };
  }

  const renderExports = options.renderExports ?? true;
  let previewImage: RenderedImage | null = null;
  let thumbnailImage: RenderedImage | null = null;
  let exportTargets: RenderedExportTarget[] = [];
  let threw = false;

  try {
    previewImage = renderer.render(buildRenderRequest(renderPlan, 'preview', undefined, options));
    thumbnailImage = renderer.render(buildRenderRequest(renderPlan, 'thumbnail', undefined, options));
    if (renderExports) {
      exportTargets = renderPlan.exportTargets.map((t) => ({
        id: t.id,
        label: t.label,
        product: t.product,
        widthPx: t.widthPx,
        heightPx: t.heightPx,
        dpi: t.dpi,
        colorMode: t.colorMode,
        formats: [...t.formats],
        framed: t.framed,
        matte: t.matte,
        image: renderer.render(buildRenderRequest(renderPlan, 'export', t, options)),
      }));
    }
  } catch {
    threw = true;
  }

  const images: RenderedImage[] = [
    previewImage, thumbnailImage, ...exportTargets.map((e) => e.image),
  ].filter((i): i is RenderedImage => i != null);
  const renderTime = images.reduce((sum, i) => sum + (i.renderMs || 0), 0);

  const exportsOk = !renderExports
    || (exportTargets.length === renderPlan.exportTargets.length && exportTargets.every((e) => imageValid(e.image)));
  const completed = !threw && imageValid(previewImage) && imageValid(thumbnailImage) && exportsOk;
  const renderStatus: RenderStatus = completed ? 'completed' : 'failed';

  return {
    ...base,
    renderStatus,
    renderTime,
    previewImage,
    thumbnailImage,
    exportTargets,
    qualityChecks: validateRendered(renderPlan, previewImage, thumbnailImage, exportTargets, renderStatus),
  };
}
