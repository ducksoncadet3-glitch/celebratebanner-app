/**
 * @celebratebanner/render-adapter
 *
 * Connects the Render Orchestrator to the existing renderer:
 *   Memory Profile → Creative Brief → WOW Engine → Render Orchestrator →
 *   **Render Adapter** → Renderer → Rendered Preview Images → Premium Reveal
 *
 * Public API — ONE function:
 *   • renderConcept(renderPlan, renderer, options?) → RenderedConcept
 *
 * The renderer is INJECTED (the `Renderer` port), so the adapter neither imports
 * nor modifies the production render engine — it only translates a RenderPlan into
 * a renderer-ready request and packages the result. No creative decisions, no pixels.
 *
 * Governed by: docs/CREATIVE_CONSTITUTION.md · docs/CELEBRATEBANNER_DESIGN_BIBLE.md
 */

export { renderConcept } from './engine.ts';
export { buildRenderRequest, deriveSeed, scaleToLongEdge } from './mapper.ts';
export { validateRendered, imageValid } from './validator.ts';
export { SCHEMA_VERSION, REQUIRED_EXPORT_TARGETS } from './types.ts';

export type {
  RenderPlan, ExportTarget, ExportTargetId, ArrangementId, WowConceptName, PhotoSummary,
  RenderKind, RenderStatus, ColorMode,
  RenderPhotoRef, RenderThemeSpec, RenderTypographySpec, RenderBackgroundSpec,
  RenderRequest, RenderedImage, Renderer, RenderedExportTarget,
  RenderQualityChecks, RenderedConcept, RenderConceptOptions,
} from './types.ts';
