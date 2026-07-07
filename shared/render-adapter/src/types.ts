/**
 * @celebratebanner/render-adapter — types
 *
 * The last translation step before pixels:
 *   … → Render Orchestrator → **Render Adapter** → Existing Renderer → Premium Reveal
 *
 * The orchestrator produces a RenderPlan (decisions already made). The adapter
 * TRANSLATES that plan into a concrete, renderer-ready request and hands it to an
 * INJECTED renderer, then packages the renderer's output as a RenderedConcept.
 *
 * The adapter makes NO creative decisions: it does not change layouts, algorithms,
 * photo placement, or typography. It only carries the plan's already-decided values
 * across the wire. It embeds NO pixels — photos travel as references, and rendered
 * images travel as opaque handles (a `uri`), never as base64/dataURL blobs.
 */

// Upstream plan shape (read-only; never mutated).
import type {
  RenderPlan, ExportTarget, ExportTargetId, ArrangementId,
  WowConceptName, PhotoSummary,
} from '../../render-orchestrator/src/types.ts';

export type {
  RenderPlan, ExportTarget, ExportTargetId, ArrangementId, WowConceptName, PhotoSummary,
};

export const SCHEMA_VERSION = '1.0.0';

/** The four export ids every accepted plan must render. */
export const REQUIRED_EXPORT_TARGETS: ExportTargetId[] = [
  'digital', 'poster_18x24', 'poster_24x36', 'framed_24x36',
];

export type RenderKind = 'preview' | 'thumbnail' | 'export';
export type RenderStatus = 'completed' | 'skipped' | 'failed';
export type ColorMode = 'RGB' | 'CMYK';

// ── Renderer request (WHAT the renderer draws — a translation of the plan) ─────

/** A photo the renderer should place. A REFERENCE only — no binary/pixels. */
export interface RenderPhotoRef {
  photoId: string;
  filename: string | null;
  orientation: string;
  role: 'hero' | 'supporting';
  /** Hero frame from the plan's heroPlacement; supporting keep the renderer default (null). */
  frame: string | null;
  /** Hero visual weight (0–1) from the plan; null for supporting. */
  dominanceRatio: number | null;
}

export interface RenderThemeSpec {
  ground: string;
  accent: string;
  neutral: string;
  swatches: { hex: string; role: string }[];
  source: 'photos' | 'occasion-default';
}

export interface RenderTypographySpec {
  displayFont: string;
  supportingFont: string;
  alignment: string;
  titleZone: string;
  subtitleZone: string;
  headlineTreatment: string;
  labelTreatment: string;
}

export interface RenderBackgroundSpec {
  style: string;
  decorationTheme: string;
  vignette: boolean;
}

/**
 * A fully-translated, renderer-ready request for ONE output (preview, thumbnail,
 * or a specific export target). Every field is copied from the plan (or is runtime
 * text/seed) — nothing here is a fresh creative choice.
 */
export interface RenderRequest {
  kind: RenderKind;
  targetId: string;                 // 'preview' | 'thumbnail' | ExportTargetId
  label: string;
  occasion: string;
  conceptName: WowConceptName;
  arrangement: ArrangementId;
  widthPx: number;
  heightPx: number;
  dpi: number;
  colorMode: ColorMode;
  formats: string[];
  hero: RenderPhotoRef | null;
  supporting: RenderPhotoRef[];
  theme: RenderThemeSpec;
  typography: RenderTypographySpec;
  background: RenderBackgroundSpec;
  decorativeElements: string[];
  spacing: { marginRatio: number; gapRatio: number; whitespace: string };
  layering: string[];
  /** Runtime customer text (name/year/…); empty unless supplied via options. */
  bannerText: Record<string, string>;
  heroSpotlight: boolean;
  cinematicHero: boolean;
  seed: number;
}

// ── Renderer port + output ────────────────────────────────────────────────────

/**
 * One rendered output — an OPAQUE image handle. `uri` is a reference the renderer
 * hands back (e.g. an object-store key or blob url); the adapter never embeds pixel
 * data, so a RenderedConcept is safe to serialize and log.
 */
export interface RenderedImage {
  targetId: string;
  kind: RenderKind;
  format: string;
  widthPx: number;
  heightPx: number;
  colorMode: ColorMode;
  uri: string;
  byteSize: number;
  renderMs: number;
}

/**
 * The injected renderer port. The production render engine is bound to this with a
 * thin wrapper (see README); tests inject a deterministic stub. The adapter only
 * ever calls `render(request)` — it hands over a translated request and takes back
 * an image handle. It does not reach into renderer internals.
 */
export interface Renderer {
  render(request: RenderRequest): RenderedImage;
}

export interface RenderedExportTarget {
  id: ExportTargetId;
  label: string;
  product: string;
  widthPx: number;
  heightPx: number;
  dpi: number;
  colorMode: ColorMode;
  formats: string[];
  framed: boolean;
  matte: boolean;
  image: RenderedImage;
}

// ── Quality gate on the rendered result ───────────────────────────────────────

export interface RenderQualityChecks {
  passed: boolean;
  renderCompleted: boolean;
  previewExists: boolean;
  thumbnailExists: boolean;
  exportTargetsAvailable: boolean;
  /** Mirrors the upstream plan gate — a rejected plan is never rendered. */
  qualityChecksPassed: boolean;
  reasons: string[];
}

// ── The adapter's output ──────────────────────────────────────────────────────

export interface RenderedConcept {
  schemaVersion: string;
  conceptName: WowConceptName;
  occasion: string;
  arrangement: ArrangementId;
  renderStatus: RenderStatus;
  /** Total render time in ms — the sum of every image's reported renderMs. */
  renderTime: number;
  previewImage: RenderedImage | null;
  thumbnailImage: RenderedImage | null;
  exportTargets: RenderedExportTarget[];
  qualityChecks: RenderQualityChecks;
}

export interface RenderConceptOptions {
  /** Runtime customer text values, keyed by theme field name. */
  bannerText?: Record<string, string>;
  /** Override the deterministic seed derived from the plan. */
  seed?: number;
  /** Preview long-edge in px (default 1200). */
  previewLongEdge?: number;
  /** Thumbnail long-edge in px (default 400). */
  thumbnailLongEdge?: number;
  /** Render the export targets too (default true). */
  renderExports?: boolean;
}
