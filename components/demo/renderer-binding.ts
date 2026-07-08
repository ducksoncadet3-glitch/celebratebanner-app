/**
 * Canvas renderer binding (Sprint 8) — implements the Render Adapter's `Renderer`
 * port using the EXISTING render engine (renderPreview). It translates an already-
 * built RenderRequest into the render engine's RenderInput, draws to an offscreen
 * canvas, and returns the artwork as a data-URL handle the demo can display.
 *
 * It changes no layouts, arrangements, frames, or typography — it only feeds the
 * existing engine. Browser-only (needs a DOM canvas); the pure orchestration in
 * concept-previews.ts is what the tests exercise with a fake renderer instead.
 *
 * The demo has no uploaded photos, so each photo is a labeled placeholder tile —
 * but the COMPOSITION (arrangement, frames, background, palette, type) is really
 * produced by the existing engine.
 */
import { renderPreview } from '../../shared/render-engine/src/index.ts';
import type {
  RenderInput, Photo, CanvasImage, FrameId, Theme, RenderTarget,
  ArrangementId as EngineArrangementId,
} from '../../shared/render-engine/src/types.ts';
import type { Renderer, RenderRequest, RenderedImage, RenderThemeSpec, RenderPhotoRef } from '../../shared/render-adapter/src/index.ts';
import { planOrientationCorrection, heroBoxAspect, coverCropRect, SUPPORTING_ASPECT } from '../../shared/image-intelligence/src/index.ts';

export interface CanvasRendererOptions {
  /** DOM document (defaults to the global). */
  document?: Document;
  /** Cap the preview/thumbnail long edge for on-screen speed. Default 900. */
  previewMaxEdge?: number;
  /** Cap the export long edge (export targets are print-sized). Default 1400. */
  exportMaxEdge?: number;
  /** The customer's rotation for a photo, in degrees (from the builder). */
  rotationFor?: (ref: RenderPhotoRef) => number;
  /** Run the image-intelligence pass (orientation + hero fill + curation). Default true. */
  curate?: boolean;
  /**
   * Resolve a photo reference to a REAL drawable image. Used by the production
   * builder to render the customer's actual uploads. Return null/undefined to fall
   * back to a labeled placeholder tile (the demo, which has no uploads, does this).
   */
  resolveImage?: (ref: RenderPhotoRef) => CanvasImage | null | undefined;
}

// Plan hero-frame vocabulary → the render engine's real FrameId vocabulary.
const FRAME_MAP: Record<string, FrameId> = {
  'thin-gold': 'double-gold',
  gold: 'gold',
  soft: 'rounded',
  minimal: 'white',
};
function toFrame(name: string | null): FrameId {
  return (name && FRAME_MAP[name]) || 'rounded';
}

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
  return Date.now();
}

function capDims(w: number, h: number, maxEdge: number): { w: number; h: number } {
  const longEdge = Math.max(w, h);
  if (longEdge <= maxEdge) return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
  const s = maxEdge / longEdge;
  return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) };
}

/**
 * Longest edge of a prepared (rotated + cropped) image. Sized to what the renderer
 * actually draws: the hero fills a large box, supporting tiles are thumbnails. Keeping
 * these tight is what stops the intelligence pass from blowing the mobile render budget.
 */
const HERO_MAX_EDGE = 800;   // hero box is ~520px at preview size — 800 keeps a retina margin
const SUPPORTING_MAX_EDGE = 384; // supporting tiles render ~60-90px

/**
 * Prepare a photo for the renderer WITHOUT touching the uploaded file:
 *   1. bake the planned quarter turns (orientation correction),
 *   2. crop to `targetAspect` (face-safe, upward-biased) so the renderer's drawCover
 *      always takes the COVER path — no letterbox/pillarbox dead zones,
 *   3. optionally apply a restrained unified grade so supporting tiles read as a set.
 * Returns an offscreen canvas; the original image is never modified.
 */
function prepareImage(
  doc: Document,
  src: CanvasImage,
  quarterTurns: number,
  targetAspect: number,
  grade: boolean,
  maxEdge: number,
): CanvasImage {
  const iw = (src.naturalWidth ?? src.width) || 1;
  const ih = (src.naturalHeight ?? src.height) || 1;
  const turns = ((quarterTurns % 4) + 4) % 4;
  const rw = turns % 2 === 1 ? ih : iw; // dimensions after rotation
  const rh = turns % 2 === 1 ? iw : ih;

  const crop = coverCropRect(rw, rh, targetAspect);
  const scale = Math.min(1, maxEdge / Math.max(crop.sw, crop.sh));
  const outW = Math.max(1, Math.round(crop.sw * scale));
  const outH = Math.max(1, Math.round(crop.sh * scale));

  const c = doc.createElement('canvas');
  c.width = outW;
  c.height = outH;
  const ctx = c.getContext('2d');
  if (!ctx) return src;

  ctx.save();
  if (grade) { try { ctx.filter = 'contrast(1.05) saturate(0.94) brightness(0.97)'; } catch { /* filter unsupported */ } }
  // Map the crop rect (in rotated space) onto the output canvas, then rotate the source.
  ctx.scale(outW / crop.sw, outH / crop.sh);
  ctx.translate(-crop.sx, -crop.sy);
  ctx.translate(rw / 2, rh / 2);
  ctx.rotate((turns * Math.PI) / 2);
  ctx.drawImage(src as unknown as CanvasImageSource, -iw / 2, -ih / 2, iw, ih);
  ctx.restore();

  if (grade) {
    // Gentle vignette unifies the supporting grid without touching renderer algorithms.
    const g = ctx.createRadialGradient(outW / 2, outH / 2, Math.min(outW, outH) * 0.32, outW / 2, outH / 2, Math.max(outW, outH) * 0.72);
    g.addColorStop(0, 'rgba(12,14,20,0)');
    g.addColorStop(1, 'rgba(12,14,20,0.30)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, outW, outH);
  }
  return c as unknown as CanvasImage;
}

/** A synthesized placeholder photo tile — labeled gradient, sized to the target aspect. */
function makePlaceholderPhoto(doc: Document, filename: string, targetAspect: number, theme: RenderThemeSpec): CanvasImage {
  const base = 800;
  const w = targetAspect >= 1 ? base : Math.round(base * targetAspect);
  const h = targetAspect >= 1 ? Math.round(base / targetAspect) : base;
  const c = doc.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, theme.accent || '#C9A84C');
  g.addColorStop(1, theme.ground || '#0C0E14');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(0, Math.round(h * 0.5) - 1, w, 2);
  ctx.fillStyle = theme.neutral || '#FAF8F3';
  ctx.font = `600 ${Math.round(w * 0.06)}px "Outfit", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(filename, w / 2, h / 2);
  return c as unknown as CanvasImage;
}

function toRenderInput(
  doc: Document,
  req: RenderRequest,
  w: number,
  h: number,
  options: CanvasRendererOptions,
  cache: Map<string, CanvasImage>,
): RenderInput {
  const { resolveImage, rotationFor } = options;
  const curate = options.curate !== false;
  const photos: Photo[] = [];
  const frames: Record<string, FrameId> = {};

  // Hero fills its arrangement's box exactly; supporting tiles share one square crop.
  const heroAspect = heroBoxAspect(req.arrangement, w, h);

  const imageFor = (ref: RenderPhotoRef, targetAspect: number, grade: boolean, maxEdge: number): CanvasImage => {
    const src = resolveImage && resolveImage(ref);
    if (!src) return makePlaceholderPhoto(doc, ref.filename ?? ref.photoId, targetAspect, req.theme);
    if (!curate) return src;
    const correction = planOrientationCorrection({
      width: (src.naturalWidth ?? src.width) || 0,
      height: (src.naturalHeight ?? src.height) || 0,
      declaredOrientation: ref.orientation,
      userRotationDegrees: rotationFor ? rotationFor(ref) : 0,
    });
    // Prepared images are reused across concepts — supporting tiles share one square
    // crop, so they are prepared once, not once per arrangement.
    const key = `${ref.photoId}|${correction.quarterTurns}|${targetAspect.toFixed(4)}|${grade ? 1 : 0}|${maxEdge}`;
    const hit = cache.get(key);
    if (hit) return hit;
    try {
      const prepared = prepareImage(doc, src, correction.quarterTurns, targetAspect, grade, maxEdge);
      cache.set(key, prepared);
      return prepared;
    } catch {
      return src; // any canvas failure → draw the original, never block the reveal
    }
  };

  if (req.hero) {
    photos.push({ id: req.hero.photoId, image: imageFor(req.hero, heroAspect, false, HERO_MAX_EDGE) });
    frames[req.hero.photoId] = toFrame(req.hero.frame);
  }
  for (const s of req.supporting) {
    photos.push({ id: s.photoId, image: imageFor(s, SUPPORTING_ASPECT, curate, SUPPORTING_MAX_EDGE) });
    frames[s.photoId] = toFrame(s.frame);
  }
  const theme: Theme = {
    id: req.occasion,
    fields: Object.keys(req.bannerText),
    palette: { bg: req.theme.ground, accent: req.theme.accent, text: req.theme.neutral },
  };
  return {
    width: w,
    height: h,
    arrangement: req.arrangement as EngineArrangementId,
    theme,
    bannerText: req.bannerText,
    photos,
    heroId: req.hero?.photoId ?? null,
    frames,
    defaultFrame: 'rounded',
    seed: req.seed,
    cinematicHero: req.cinematicHero,
  };
}

/**
 * A Renderer (Render Adapter port) backed by the existing render engine. Given a
 * translated RenderRequest, it draws with `renderPreview` and hands back the artwork
 * as a data-URL image handle.
 */
export function createCanvasRenderer(options: CanvasRendererOptions = {}): Renderer {
  const doc = options.document ?? (typeof document !== 'undefined' ? document : undefined);
  if (!doc) throw new Error('createCanvasRenderer requires a DOM document (browser only).');
  const previewMaxEdge = options.previewMaxEdge ?? 900;
  const exportMaxEdge = options.exportMaxEdge ?? 1400;
  // Reused across every concept this renderer draws.
  const preparedCache = new Map<string, CanvasImage>();

  return {
    render(req: RenderRequest): RenderedImage {
      const maxEdge = req.kind === 'export' ? exportMaxEdge : previewMaxEdge;
      const { w, h } = capDims(req.widthPx, req.heightPx, maxEdge);
      const canvas = doc.createElement('canvas');
      const input = toRenderInput(doc, req, w, h, options, preparedCache);
      const t0 = nowMs();
      renderPreview(canvas as unknown as RenderTarget, input, { previewWidth: w, previewHeight: h, dpr: 1 });
      const format = req.kind === 'export' ? 'jpg' : 'png';
      const uri = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png');
      const renderMs = Math.max(1, Math.round(nowMs() - t0));
      return {
        targetId: req.targetId,
        kind: req.kind,
        format,
        widthPx: w,
        heightPx: h,
        colorMode: req.colorMode,
        uri,
        byteSize: uri.length,
        renderMs,
      };
    },
  };
}
