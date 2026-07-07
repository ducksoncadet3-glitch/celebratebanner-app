/**
 * Mapper — translates a RenderPlan into concrete, renderer-ready RenderRequests.
 * This is pure TRANSLATION: every value is copied from the plan (or is runtime
 * text/seed). No layout, algorithm, placement, or typography choice is made here.
 */
import type {
  RenderPlan, ExportTarget, RenderRequest, RenderKind, RenderPhotoRef,
  RenderThemeSpec, RenderTypographySpec, RenderBackgroundSpec, ColorMode,
  RenderConceptOptions,
} from './types.ts';

const PREVIEW_LONG_EDGE = 1200;
const THUMBNAIL_LONG_EDGE = 400;
const PREVIEW_DPI = 72;

// Deterministic FNV-1a hash → uint32. Used only to derive a stable render seed.
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A stable seed for a plan — same plan always seeds the renderer identically. */
export function deriveSeed(plan: RenderPlan): number {
  return hashString(`${plan.occasion}::${plan.conceptName}::${plan.renderInstructions.arrangement}`);
}

/** Scale a target size down to a preview/thumbnail long-edge, preserving aspect. */
export function scaleToLongEdge(widthPx: number, heightPx: number, longEdge: number): { width: number; height: number } {
  const w = widthPx > 0 ? widthPx : 2; // guard against a degenerate plan
  const h = heightPx > 0 ? heightPx : 3;
  const scale = longEdge / Math.max(w, h);
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

/** The reference target whose aspect ratio previews inherit (the digital master). */
function referenceTarget(plan: RenderPlan): ExportTarget | undefined {
  return plan.exportTargets.find((t) => t.id === 'digital') ?? plan.exportTargets[0];
}

function heroRef(plan: RenderPlan): RenderPhotoRef | null {
  if (!plan.heroPhoto) return null;
  const hp = plan.renderInstructions.heroPlacement;
  return {
    photoId: plan.heroPhoto.photoId,
    filename: plan.heroPhoto.filename ?? null,
    orientation: plan.heroPhoto.orientation,
    role: 'hero',
    frame: hp.frame,
    dominanceRatio: hp.dominanceRatio,
  };
}

function supportingRefs(plan: RenderPlan): RenderPhotoRef[] {
  // Honor the plan's cell count — draw no more supporting photos than it placed.
  const count = plan.renderInstructions.supportingPlacement.count;
  return plan.supportingPhotos.slice(0, count).map((p) => ({
    photoId: p.photoId,
    filename: p.filename ?? null,
    orientation: p.orientation,
    role: 'supporting' as const,
    frame: null,             // supporting tiles use the renderer's default frame
    dominanceRatio: null,
  }));
}

function themeSpec(plan: RenderPlan): RenderThemeSpec {
  const cp = plan.renderInstructions.colorPalette;
  return {
    ground: cp.ground,
    accent: cp.accent,
    neutral: cp.neutral,
    swatches: cp.palette.map((p) => ({ hex: p.hex, role: p.role })),
    source: cp.source,
  };
}

function typographySpec(plan: RenderPlan): RenderTypographySpec {
  const tp = plan.renderInstructions.typographyPlacement;
  return {
    displayFont: tp.displayFont,
    supportingFont: tp.supportingFont,
    alignment: tp.alignment,
    titleZone: tp.titleZone,
    subtitleZone: tp.subtitleZone,
    headlineTreatment: tp.headlineTreatment,
    labelTreatment: tp.labelTreatment,
  };
}

function backgroundSpec(plan: RenderPlan): RenderBackgroundSpec {
  const bg = plan.renderInstructions.backgroundSelection;
  return { style: bg.style, decorationTheme: bg.decorationTheme, vignette: bg.vignette };
}

interface Dims {
  targetId: string;
  label: string;
  widthPx: number;
  heightPx: number;
  dpi: number;
  colorMode: ColorMode;
  formats: string[];
}

function dimsFor(kind: RenderKind, plan: RenderPlan, target: ExportTarget | undefined, opts: RenderConceptOptions): Dims {
  const ref = referenceTarget(plan);
  const refW = ref ? ref.widthPx : 2;
  const refH = ref ? ref.heightPx : 3;
  if (kind === 'preview') {
    const { width, height } = scaleToLongEdge(refW, refH, opts.previewLongEdge ?? PREVIEW_LONG_EDGE);
    return { targetId: 'preview', label: 'Live Preview', widthPx: width, heightPx: height, dpi: PREVIEW_DPI, colorMode: 'RGB', formats: ['png'] };
  }
  if (kind === 'thumbnail') {
    const { width, height } = scaleToLongEdge(refW, refH, opts.thumbnailLongEdge ?? THUMBNAIL_LONG_EDGE);
    return { targetId: 'thumbnail', label: 'Thumbnail', widthPx: width, heightPx: height, dpi: PREVIEW_DPI, colorMode: 'RGB', formats: ['png'] };
  }
  // export
  if (!target) throw new Error('buildRenderRequest: an export target is required for kind "export".');
  return {
    targetId: target.id, label: target.label, widthPx: target.widthPx, heightPx: target.heightPx,
    dpi: target.dpi, colorMode: target.colorMode, formats: target.formats,
  };
}

/**
 * Build a single renderer-ready request from the plan. `target` is required when
 * `kind === 'export'` and ignored otherwise.
 */
export function buildRenderRequest(
  plan: RenderPlan,
  kind: RenderKind,
  target?: ExportTarget,
  options: RenderConceptOptions = {},
): RenderRequest {
  const ri = plan.renderInstructions;
  const d = dimsFor(kind, plan, target, options);
  return {
    kind,
    targetId: d.targetId,
    label: d.label,
    occasion: plan.occasion,
    conceptName: plan.conceptName,
    arrangement: ri.arrangement,
    widthPx: d.widthPx,
    heightPx: d.heightPx,
    dpi: d.dpi,
    colorMode: d.colorMode,
    formats: [...d.formats],
    hero: heroRef(plan),
    supporting: supportingRefs(plan),
    theme: themeSpec(plan),
    typography: typographySpec(plan),
    background: backgroundSpec(plan),
    decorativeElements: [...ri.decorativeElements],
    spacing: { marginRatio: ri.spacing.marginRatio, gapRatio: ri.spacing.gapRatio, whitespace: ri.spacing.whitespace },
    layering: [...ri.layering.order],
    bannerText: { ...(options.bannerText ?? {}) },
    heroSpotlight: ri.heroPlacement.spotlight,
    cinematicHero: true,       // matches the existing renderer's default (index.html)
    seed: options.seed ?? deriveSeed(plan),
  };
}
