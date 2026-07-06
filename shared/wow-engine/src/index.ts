/**
 * @celebratebanner/wow-engine
 *
 * The WOW Engine (WOW Engine Pipeline, Stages 6–8 — art direction, scoring, gate).
 *
 * Public API — ONE function:
 *   • generateWOWPresentation(memoryProfile, creativeBrief, options?) → WOWPresentation
 *
 * Consumes:  Memory Profile  +  Creative Brief
 * Produces:  WOWPresentation — four premium concepts, WOW-scored, gated at 90.
 * Renders:   nothing. Creative decisions only (no HTML, Canvas, images, or pixels).
 *
 * Governed by: docs/CREATIVE_CONSTITUTION.md · docs/CELEBRATEBANNER_DESIGN_BIBLE.md
 * Spec:        docs/WOW_ENGINE_SPECIFICATION.md · docs/WOW_ENGINE_PIPELINE.md
 */

export { generateWOWPresentation } from './engine.ts';
export { SCHEMA_VERSION, WOW_THRESHOLD, CONCEPT_ORDER } from './types.ts';

export type {
  MemoryProfile,
  CreativeBrief,
  OccasionType,
  ConceptType,
  PhotoSummary,
  WowConceptName,
  WowPresentation,
  WowConcept,
  WowScoreBreakdown,
  LayoutRecipe,
  ColorRecipe,
  ColorRoleRecipe,
  TypographyRecipe,
  SharePreview,
  GenerateWOWOptions,
} from './types.ts';
