/**
 * The render orchestrator — public entry point.
 *
 *   generateRenderPlan(memoryProfile, creativeBrief, wowPresentation, options?) → RenderPlan
 *
 * Selects a concept (the recommended one by default), TRANSLATES its WOW-Engine
 * decisions into renderer-ready instructions + export targets, and runs the quality
 * gate. Makes no creative decisions; produces no pixels. Deterministic (no Date/
 * random/I-O; createdAt is null unless options.now is supplied).
 */
import type {
  MemoryProfile, CreativeBrief, WowPresentation, WowConcept, WowConceptName,
  RenderPlan, RenderInstructions, ExportTarget, GenerateRenderPlanOptions,
} from './types.ts';
import { SCHEMA_VERSION } from './types.ts';
import { buildRenderInstructions, buildExportTargets } from './mapper.ts';
import { validate } from './validator.ts';

const ENGINE_VERSION = '0.1.0';

// Empty-but-typed instruction block for the rejected-plan case (concept missing).
function emptyInstructions(): RenderInstructions {
  return {
    arrangement: 'classic',
    heroPlacement: { zone: 'center', dominanceRatio: 0, frame: 'thin-gold', spotlight: false, protectFace: true },
    supportingPlacement: { arrangement: 'classic', maxCells: 0, count: 0, gapRatio: 0.02, treatment: '' },
    typographyPlacement: { titleZone: 'top-center', subtitleZone: 'top-center-under-title', alignment: 'center', displayFont: '', supportingFont: '', headlineTreatment: '', labelTreatment: '' },
    backgroundSelection: { style: 'obsidian-gradient', decorationTheme: 'obsidian', vignette: true },
    colorPalette: { ground: '', accent: '', neutral: '', palette: [], source: 'occasion-default' },
    decorativeElements: [],
    spacing: { marginRatio: 0.055, gapRatio: 0.02, whitespace: '' },
    layering: { order: ['background', 'decorations', 'supporting-photos', 'hero-photo', 'title-text', 'preview-overlay'] },
  };
}

export function generateRenderPlan(
  memoryProfile: MemoryProfile,
  creativeBrief: CreativeBrief,
  wowPresentation: WowPresentation,
  options?: GenerateRenderPlanOptions,
): RenderPlan {
  const targetName: WowConceptName = options?.conceptName ?? wowPresentation.recommendedConcept;
  const concept: WowConcept | undefined = wowPresentation.concepts.find((c) => c.conceptName === targetName);

  const exportTargets: ExportTarget[] = buildExportTargets(memoryProfile);
  const qualityChecks = validate(concept, exportTargets);

  const renderInstructions = concept
    ? buildRenderInstructions(concept, creativeBrief, memoryProfile)
    : emptyInstructions();

  return {
    schemaVersion: SCHEMA_VERSION,
    version: ENGINE_VERSION,
    createdAt: options?.now ?? null,
    occasion: memoryProfile.occasion,
    conceptName: targetName,
    accepted: qualityChecks.passed,
    heroPhoto: concept ? concept.heroPhoto : null,
    supportingPhotos: concept ? concept.supportingPhotos : [],
    layoutRecipe: concept ? concept.layoutRecipe : emptyLayout(),
    colorRecipe: concept ? concept.colorRecipe : emptyColor(),
    typographyRecipe: concept ? concept.typographyRecipe : emptyType(),
    renderInstructions,
    exportTargets,
    qualityChecks,
  };
}

function emptyLayout(): WowConcept['layoutRecipe'] {
  return { arrangement: '', heroPlacement: '', heroDominanceRatio: 0, supportingLayout: '', balance: '', whitespace: '', focalPath: '', maxSupporting: 0 };
}
function emptyColor(): WowConcept['colorRecipe'] {
  return { ground: '', accent: '', neutral: '', palette: [], source: 'occasion-default', guidance: '' };
}
function emptyType(): WowConcept['typographyRecipe'] {
  return { style: '', displayFont: '', supportingFont: '', headlineTreatment: '', labelTreatment: '', guidance: '' };
}
