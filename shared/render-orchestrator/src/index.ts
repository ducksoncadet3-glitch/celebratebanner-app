/**
 * @celebratebanner/render-orchestrator
 *
 * The bridge between the WOW Engine and the renderer:
 *   Memory Profile → Creative Brief → WOW Engine → **Render Orchestrator** → Renderer → Premium Reveal
 *
 * Public API — ONE function:
 *   • generateRenderPlan(memoryProfile, creativeBrief, wowPresentation, options?) → RenderPlan
 *
 * Translates the WOW Engine's DECISIONS into renderer-ready INSTRUCTIONS + export
 * targets, gated by quality checks. Makes no creative decisions; produces no pixels.
 *
 * Governed by: docs/CREATIVE_CONSTITUTION.md · docs/CELEBRATEBANNER_DESIGN_BIBLE.md
 * Spec:        docs/WOW_ENGINE_SPECIFICATION.md · docs/WOW_ENGINE_PIPELINE.md
 */

export { generateRenderPlan } from './engine.ts';
export { conceptArrangement, buildRenderInstructions, buildExportTargets } from './mapper.ts';
export { validate } from './validator.ts';
export { SCHEMA_VERSION, WOW_THRESHOLD } from './types.ts';

export type {
  MemoryProfile, CreativeBrief, WowPresentation, WowConcept, WowConceptName, PhotoSummary,
  LayoutRecipe, ColorRecipe, TypographyRecipe,
  ArrangementId, HeroPlacement, SupportingPlacement, TypographyPlacement, BackgroundSelection,
  ColorPaletteInstruction, SpacingSpec, LayeringSpec, RenderInstructions,
  ExportTarget, ExportTargetId, QualityChecks, RenderPlan, GenerateRenderPlanOptions,
} from './types.ts';
