/**
 * Mapper — translates the WOW Engine's already-made decisions into concrete,
 * renderer-ready instructions and export targets. This is pure TRANSLATION:
 * every value is derived from the concept / brief / profile. No taste is applied.
 */
import type {
  MemoryProfile, CreativeBrief, WowConcept, WowConceptName,
  ArrangementId, RenderInstructions, ExportTarget,
} from './types.ts';

// WOW concept → the renderer's real arrangement (Design Bible Part 5 layout philosophy).
const CONCEPT_ARRANGEMENT: Record<WowConceptName, ArrangementId> = {
  'Signature Edition': 'classic',   // central hero, disciplined grid
  'Luxury Gold': 'pyramid',         // grand, hero-dominant, symmetrical tiers
  'Family Legacy': 'mosaic',        // gathered memories, narrative grid
  'Modern Editorial': 'magazine',   // editorial asymmetry, hero to one side
};

const HERO_ZONE: Record<ArrangementId, string> = {
  classic: 'center', pyramid: 'apex-top', mosaic: 'center', magazine: 'left',
};
const HERO_FRAME: Record<WowConceptName, string> = {
  'Signature Edition': 'thin-gold', 'Luxury Gold': 'gold', 'Family Legacy': 'soft', 'Modern Editorial': 'minimal',
};

// Occasion → renderer background theme-decoration key + background style.
function decorationTheme(occasion: string): string {
  switch (occasion) {
    case 'championship': case 'team': case 'senior_night': return 'stadium';
    case 'wedding': return 'floral';
    case 'memorial': return 'reverent';
    case 'graduation': return 'graduation';
    default: return 'obsidian';
  }
}

function orientationFor(occasion: string): 'portrait' | 'landscape' | 'square' {
  if (occasion === 'team') return 'landscape';
  if (occasion === 'social') return 'square';
  return 'portrait';
}

export function conceptArrangement(name: WowConceptName): ArrangementId {
  return CONCEPT_ARRANGEMENT[name];
}

export function buildRenderInstructions(
  concept: WowConcept,
  brief: CreativeBrief,
  profile: MemoryProfile,
): RenderInstructions {
  const arrangement = conceptArrangement(concept.conceptName);
  const layout = concept.layoutRecipe;
  const color = concept.colorRecipe;
  const type = concept.typographyRecipe;
  const isLuxury = concept.conceptName === 'Luxury Gold';
  const isMagazine = arrangement === 'magazine';

  const heroPlacement = {
    zone: HERO_ZONE[arrangement],
    dominanceRatio: layout.heroDominanceRatio,
    frame: HERO_FRAME[concept.conceptName],
    spotlight: isLuxury,
    protectFace: true, // Design Bible: never crop through faces
  };

  const supportingPlacement = {
    arrangement,
    maxCells: layout.maxSupporting,
    count: Math.min(layout.maxSupporting, concept.supportingPhotos.length),
    gapRatio: 0.02,
    treatment: 'Unified grade; smaller and quieter; lead the eye back to the hero.',
  };

  const typographyPlacement = {
    titleZone: isMagazine ? 'left-top' : 'top-center',
    subtitleZone: isMagazine ? 'left-top-under-title' : 'top-center-under-title',
    alignment: isMagazine ? 'left' : 'center',
    displayFont: type.displayFont,
    supportingFont: type.supportingFont,
    headlineTreatment: type.headlineTreatment,
    labelTreatment: type.labelTreatment,
  };

  const backgroundSelection = {
    style: isLuxury ? 'obsidian-gold-glow' : 'obsidian-gradient',
    decorationTheme: decorationTheme(profile.occasion),
    vignette: true,
  };

  const colorPalette = {
    ground: color.ground,
    accent: color.accent,
    neutral: color.neutral,
    palette: color.palette.map((p) => ({ hex: p.hex, role: p.role })),
    source: color.source,
  };

  // Decorative elements come straight from the brief's allowlist (never invented here).
  const decorativeElements = Array.isArray(brief.decorativeDirection.allowed)
    ? brief.decorativeDirection.allowed.slice(0, 8).map((s) => String(s))
    : [];

  const spacing = {
    marginRatio: 0.055,
    gapRatio: 0.02,
    whitespace: brief.compositionDirection.whitespace,
  };

  const layering = {
    order: ['background', 'decorations', 'supporting-photos', 'hero-photo', 'title-text', 'preview-overlay'],
  };

  return {
    arrangement, heroPlacement, supportingPlacement, typographyPlacement,
    backgroundSelection, colorPalette, decorativeElements, spacing, layering,
  };
}

// ── Export targets ────────────────────────────────────────────────────────────
const px = (inches: number, dpi: number): number => Math.round(inches * dpi);

/** Build the four export-target specs (specs only — no pixels). */
export function buildExportTargets(profile: MemoryProfile): ExportTarget[] {
  const dpi = 300;
  const orientation = orientationFor(profile.occasion);
  // Trim inches per size; swap for landscape/square so orientation is honored.
  const dims = (shortIn: number, longIn: number): { w: number; h: number } => {
    if (orientation === 'landscape') return { w: longIn, h: shortIn };
    if (orientation === 'square') return { w: longIn, h: longIn };
    return { w: shortIn, h: longIn };
  };
  const target = (
    id: ExportTargetIdLocal, label: string, product: string,
    shortIn: number, longIn: number,
    opts: { colorMode: 'CMYK' | 'RGB'; formats: string[]; framed?: boolean; matte?: boolean; note: string },
  ): ExportTarget => {
    const { w, h } = dims(shortIn, longIn);
    return {
      id, label, product, widthIn: w, heightIn: h, dpi,
      widthPx: px(w, dpi), heightPx: px(h, dpi),
      bleedIn: 0.125, safeMarginIn: 0.25,
      colorMode: opts.colorMode, formats: opts.formats, orientation,
      framed: !!opts.framed, matte: !!opts.matte, note: opts.note,
    };
  };

  return [
    target('digital', 'Digital Download', 'Digital download', 24, 36, {
      colorMode: 'RGB', formats: ['jpg', 'pdf'],
      note: 'Print-ready master file for instant download; render once at full resolution.',
    }),
    target('poster_18x24', '18×24 Poster', 'Standard print', 18, 24, {
      colorMode: 'CMYK', formats: ['pdf', 'jpg'],
      note: 'Small poster print; CMYK at 300 DPI with bleed + safe margin.',
    }),
    target('poster_24x36', '24×36 Poster', 'Premium print', 24, 36, {
      colorMode: 'CMYK', formats: ['pdf', 'jpg'],
      note: 'Flagship poster print; CMYK at 300 DPI with bleed + safe margin.',
    }),
    target('framed_24x36', 'Framed Edition', 'Framed', 24, 36, {
      colorMode: 'CMYK', formats: ['pdf', 'jpg'], framed: true, matte: true,
      note: 'Framed keepsake; same 24×36 print inside a mat + frame (frame color chosen after checkout).',
    }),
  ];
}

// Local alias so the target() signature stays readable without re-importing.
type ExportTargetIdLocal = ExportTarget['id'];
