/**
 * Core types for the CelebrateBanner render engine.
 *
 * The engine is intentionally environment-agnostic: types that would be tied
 * to the DOM (HTMLImageElement, HTMLCanvasElement) are abstracted via
 * `CanvasImage` and `RenderTarget` so the SAME code runs in:
 *
 *   • Browser           — HTMLImageElement + HTMLCanvasElement.getContext('2d')
 *   • Node + canvas     — Image (node-canvas) + Canvas.getContext('2d')
 *   • Node + skia       — Image (skia-canvas) + Canvas.getContext('2d')
 *
 * All renderers receive a `RenderContext` which exposes the same surface the
 * stdlib CanvasRenderingContext2D does — we just type it structurally so the
 * package has no hard DOM dependency.
 */

/** A drawable image — either an HTMLImageElement, ImageBitmap, or node-canvas Image. */
export type CanvasImage = {
  readonly width: number;
  readonly height: number;
  readonly naturalWidth?: number;
  readonly naturalHeight?: number;
  /** Per-photo rotation override read by drawCover. Set by the dispatcher. */
  _rotDeg?: number;
};

/** Structural subset of CanvasRenderingContext2D used by the engine. */
export interface RenderContext {
  // State
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angleRad: number): void;
  scale(x: number, y: number): void;

  // Style
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  filter: string;
  globalCompositeOperation: GlobalCompositeOperation;
  globalAlpha: number;

  // Paths
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arc(x: number, y: number, r: number, start: number, end: number, ccw?: boolean): void;
  arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void;
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  ellipse(
    x: number, y: number, rx: number, ry: number, rot: number,
    start: number, end: number, ccw?: boolean,
  ): void;
  rect(x: number, y: number, w: number, h: number): void;

  // Drawing
  fill(): void;
  stroke(): void;
  clip(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number, maxWidth?: number): void;
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void;
  drawImage(
    image: CanvasImageSource,
    sx: number, sy: number, sw: number, sh: number,
    dx: number, dy: number, dw: number, dh: number,
  ): void;

  // Gradients
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient;
  createRadialGradient(
    x0: number, y0: number, r0: number, x1: number, y1: number, r1: number,
  ): CanvasGradient;
}

// ── Engine input ────────────────────────────────────────────────────────────
/** 'standard' = historical tiled grid. 'wow' = intentional, non-repeating geometry. */
export type RenderMode = 'standard' | 'wow';

export type ArrangementId = 'classic' | 'magazine' | 'pyramid' | 'scattered' | 'mosaic';

export type FrameId =
  | 'rounded' | 'circle' | 'polaroid' | 'gold' | 'hexagon'
  | 'diamond' | 'scallop' | 'vintage' | 'tape' | 'neon'
  | 'baroque' | 'shadow-box' | 'glitter' | 'ribbon' | 'crown'
  | 'white' | 'shadow' | 'double-gold' | 'heart' | 'star';

export type MockupId = 'retractable-stand';

export interface Photo {
  /** Stable id used for frame and rotation lookups. */
  id: string;
  /** Image source — see `CanvasImage` notes. */
  image: CanvasImage;
}

export interface BannerText {
  name?: string;
  year?: string;
  school?: string;
  /** Any additional theme-specific fields. */
  [key: string]: string | undefined;
}

export interface Palette {
  bg: string;        // banner background base color (#RRGGBB)
  accent: string;    // gold/accent color (#RRGGBB)
  text: string;      // primary text color (#RRGGBB)
}

export interface Theme {
  id: string;
  /** Ordered fields the text renderer should pull from BannerText. First is the headline. */
  fields: string[];
  /** Per-field display metadata (placeholder text, label). */
  fieldMeta?: Record<string, { label?: string; placeholder?: string }>;
  palette: Palette;
}

export interface RenderInput {
  /** Canvas pixel dimensions. Use 800×1200 for previews, 2400×3600 for HD print. */
  width: number;
  height: number;
  /** Whole-banner layout. */
  arrangement: ArrangementId;
  /** Theme — palette + which text fields show. */
  theme: Theme;
  /** Banner text values keyed by theme field name. */
  bannerText: BannerText;
  /** Photos to render. The hero is identified by `heroId`. */
  photos: Photo[];
  /** Id of the hero photo, or null to use photos[0]. */
  heroId: string | null;
  /** Per-photo frame override. Falls back to defaultFrame. */
  frames?: Record<string, FrameId>;
  defaultFrame?: FrameId;
  /** Per-photo user rotation in 90° increments. */
  rotations?: Record<string, number>;
  /** Deterministic seed for jitter / random rotation. */
  seed?: number;
  /**
   * When true, hero is rendered with the cinematic 3D card (heavy shadow, gold
   * border, specular highlight). When false, hero uses its assigned frame.
   * Default true — matches the existing index.html behavior.
   */
  cinematicHero?: boolean;
  /**
   * Rendering mode. Omit (or 'standard') for the historical behaviour: a fixed cell
   * grid filled by tiling the supporting photos. 'wow' derives an INTENTIONAL geometry
   * from how many photos actually exist — fewer, larger cells and never a repeat.
   * If the WOW geometry is degenerate the renderer falls back to 'standard'.
   */
  renderMode?: RenderMode;
}

// ── Renderer interfaces (used by the registries) ────────────────────────────
export interface RenderEnv {
  ctx: RenderContext;
  /** Canvas pixel width / height. */
  W: number;
  H: number;
  /** Y coordinate where the photo content area begins (under the banner text). */
  contentTop: number;
  /** Deterministic PRNG, already seeded for this layout. Returns 0..1. */
  rng: () => number;
  input: RenderInput;
}

export interface ArrangementRenderer {
  id: ArrangementId;
  label: string;
  /** Photo-count guidance shown in the UI. */
  minPhotos: number;
  maxPhotos: number;
  /** Render the layout. The hero is photos[0] (engine moves it there). */
  render: (env: RenderEnv, photos: Photo[]) => void;
}

export interface FrameRenderer {
  id: FrameId;
  label: string;
  /**
   * Draw a single framed photo into the (x, y, w, h) box.
   * `withShadow` enables the per-frame drop shadow; the dispatcher controls
   * this so layered layouts can disable shadows on supporting tiles.
   */
  draw: (ctx: RenderContext, img: CanvasImage, x: number, y: number, w: number, h: number, withShadow: boolean) => void;
}

export interface MockupRenderer<Opts = unknown> {
  id: MockupId;
  label: string;
  /**
   * Renders a presentation mockup that surrounds a rendered banner canvas.
   * The banner is passed in as a CanvasImageSource (already rendered).
   */
  render: (target: RenderTarget, banner: CanvasImage, opts?: Opts) => void;
}

/** A drawable surface — abstracts HTMLCanvasElement vs node-canvas. */
export interface RenderTarget {
  width: number;
  height: number;
  getContext(kind: '2d'): RenderContext;
}
