/**
 * @celebratebanner/refinement-engine
 *
 * Natural-language refinement of an approved WOW concept:
 *   … WOW Engine → (customer picks a concept) → **Refinement Engine** → re-gated concept
 *
 * Public API — ONE function:
 *   • refineConcept(selectedConcept, customerInstruction, creativeBrief, memoryProfile, options?)
 *       → RefinedConcept
 *
 * Parses the instruction into intents, applies bounded recipe edits, recomputes the
 * WOW Score, and re-gates at 90 — refusing anything that violates the Creative
 * Constitution. Deterministic, pixel-free, dependency-free.
 *
 * Governed by: docs/CREATIVE_CONSTITUTION.md · docs/CELEBRATEBANNER_DESIGN_BIBLE.md
 */

export { refineConcept } from './engine.ts';
export { parseInstruction } from './parser.ts';
export { REFINEMENT_RULES } from './rules.ts';
export { recomputeScore, passesGate, evaluateConstitution } from './validator.ts';
export { SCHEMA_VERSION, WOW_THRESHOLD, SCORE_MAX, REFINEMENT_INTENTS } from './types.ts';

export type {
  WowConcept, WowConceptName, WowScoreBreakdown, CreativeBrief, MemoryProfile,
  ScoreCategory, RefinementIntent, ForbiddenRequest, ParsedInstruction,
  FieldChange, AppliedRefinement, ConstitutionChecks, RefinedConcept, RefineOptions,
} from './types.ts';
