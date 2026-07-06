/**
 * The WOW Engine — public entry point.
 *
 *   generateWOWPresentation(memoryProfile, creativeBrief, options?) → WOWPresentation
 *
 * Produces exactly four art-directed premium concepts (Design Bible Part 5),
 * each scored against the 100-point WOW rubric (Part 7) and gated at 90.
 * Decides WHAT to show; renders no pixels. Deterministic (no Date/random/I-O;
 * `createdAt` is null unless the caller supplies options.now).
 */
import type {
  MemoryProfile, CreativeBrief, WowPresentation, WowConcept, GenerateWOWOptions,
} from './types.ts';
import { CONCEPT_ORDER, SCHEMA_VERSION } from './types.ts';
import { buildConcept } from './concepts.ts';

const ENGINE_VERSION = '0.1.0';

export function generateWOWPresentation(
  memoryProfile: MemoryProfile,
  creativeBrief: CreativeBrief,
  options?: GenerateWOWOptions,
): WowPresentation {
  const concepts: WowConcept[] = CONCEPT_ORDER.map((name) =>
    buildConcept(name, memoryProfile, creativeBrief),
  );

  const overallWOWScore = concepts.length
    ? Math.round(concepts.reduce((s, c) => s + c.wowScore, 0) / concepts.length)
    : 0;

  // Presentation clears the gate only if EVERY revealed concept independently clears 90.
  const masterpiecePassed = concepts.every((c) => c.masterpiecePassed);

  return {
    schemaVersion: SCHEMA_VERSION,
    version: ENGINE_VERSION,
    createdAt: options?.now ?? null,
    occasion: memoryProfile.occasion,
    recommendedConcept: creativeBrief.recommendedConcept,
    masterpiecePassed,
    overallWOWScore,
    concepts,
  };
}
