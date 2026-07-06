/**
 * Validator — the quality gate. A RenderPlan is accepted only when EVERY check
 * passes; otherwise it is rejected with human-readable reasons. Deterministic.
 *
 * Checks: hero exists · supporting exist · WOW ≥ 90 · masterpiece passed ·
 * layout recipe complete · typography recipe complete · export targets defined.
 */
import type { WowConcept, LayoutRecipe, TypographyRecipe, ExportTarget, QualityChecks } from './types.ts';
import { WOW_THRESHOLD } from './types.ts';

const REQUIRED_TARGETS = ['digital', 'poster_18x24', 'poster_24x36', 'framed_24x36'];

function layoutComplete(l: LayoutRecipe | undefined): boolean {
  if (!l) return false;
  const strOk = [l.arrangement, l.heroPlacement, l.supportingLayout, l.balance, l.whitespace, l.focalPath]
    .every((v) => typeof v === 'string' && v.length > 0);
  const dom = l.heroDominanceRatio;
  const domOk = typeof dom === 'number' && dom > 0 && dom <= 1;
  const maxOk = typeof l.maxSupporting === 'number' && l.maxSupporting >= 0;
  return strOk && domOk && maxOk;
}

function typographyComplete(t: TypographyRecipe | undefined): boolean {
  if (!t) return false;
  return [t.style, t.displayFont, t.supportingFont, t.headlineTreatment, t.labelTreatment]
    .every((v) => typeof v === 'string' && v.length > 0);
}

function targetsDefined(targets: ExportTarget[]): boolean {
  if (!Array.isArray(targets) || targets.length === 0) return false;
  const ids = new Set(targets.map((t) => t.id));
  const allPresent = REQUIRED_TARGETS.every((id) => ids.has(id as ExportTarget['id']));
  const allSized = targets.every((t) => t.widthPx > 0 && t.heightPx > 0 && t.dpi > 0);
  return allPresent && allSized;
}

export function validate(concept: WowConcept | undefined, exportTargets: ExportTarget[]): QualityChecks {
  const reasons: string[] = [];

  if (!concept) {
    return {
      passed: false, heroPhoto: false, supportingPhotos: false, wowScore: false,
      masterpiecePassed: false, layoutRecipeComplete: false, typographyRecipeComplete: false,
      exportTargetsDefined: targetsDefined(exportTargets),
      reasons: ['Concept not found in the WOW presentation.'],
    };
  }

  const heroPhoto = concept.heroPhoto != null;
  const supportingPhotos = Array.isArray(concept.supportingPhotos) && concept.supportingPhotos.length >= 1;
  const wowScore = typeof concept.wowScore === 'number' && concept.wowScore >= WOW_THRESHOLD;
  const masterpiecePassed = concept.masterpiecePassed === true;
  const layoutRecipeComplete = layoutComplete(concept.layoutRecipe);
  const typographyRecipeComplete = typographyComplete(concept.typographyRecipe);
  const exportTargetsDefined = targetsDefined(exportTargets);

  if (!heroPhoto) reasons.push('Hero photo is missing — every concept must be anchored by a hero.');
  if (!supportingPhotos) reasons.push('No supporting photos — at least one is required.');
  if (!wowScore) reasons.push(`WOW Score ${concept.wowScore} is below the ${WOW_THRESHOLD} gate.`);
  if (!masterpiecePassed) reasons.push('Concept did not pass the Masterpiece gate.');
  if (!layoutRecipeComplete) reasons.push('Layout recipe is incomplete.');
  if (!typographyRecipeComplete) reasons.push('Typography recipe is incomplete.');
  if (!exportTargetsDefined) reasons.push('Export targets are not fully defined.');

  const passed = heroPhoto && supportingPhotos && wowScore && masterpiecePassed
    && layoutRecipeComplete && typographyRecipeComplete && exportTargetsDefined;

  return {
    passed, heroPhoto, supportingPhotos, wowScore, masterpiecePassed,
    layoutRecipeComplete, typographyRecipeComplete, exportTargetsDefined, reasons,
  };
}
