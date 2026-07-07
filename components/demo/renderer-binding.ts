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
import type { Renderer, RenderRequest, RenderedImage, RenderThemeSpec } from '../../shared/render-adapter/src/index.ts';

export interface CanvasRendererOptions {
  /** DOM document (defaults to the global). */
  document?: Document;
  /** Cap the preview/thumbnail long edge for on-screen speed. Default 900. */
  previewMaxEdge?: number;
  /** Cap the export long edge (export targets are print-sized). Default 1400. */
  exportMaxEdge?: number;
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

/** A synthesized placeholder photo tile — labeled gradient, sized by orientation. */
function makePlaceholderPhoto(doc: Document, filename: string, orientation: string, theme: RenderThemeSpec): CanvasImage {
  const portrait = orientation !== 'landscape';
  const w = portrait ? 600 : 800;
  const h = portrait ? 800 : 600;
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

function toRenderInput(doc: Document, req: RenderRequest, w: number, h: number): RenderInput {
  const photos: Photo[] = [];
  const frames: Record<string, FrameId> = {};
  if (req.hero) {
    photos.push({ id: req.hero.photoId, image: makePlaceholderPhoto(doc, req.hero.filename ?? req.hero.photoId, req.hero.orientation, req.theme) });
    frames[req.hero.photoId] = toFrame(req.hero.frame);
  }
  for (const s of req.supporting) {
    photos.push({ id: s.photoId, image: makePlaceholderPhoto(doc, s.filename ?? s.photoId, s.orientation, req.theme) });
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

  return {
    render(req: RenderRequest): RenderedImage {
      const maxEdge = req.kind === 'export' ? exportMaxEdge : previewMaxEdge;
      const { w, h } = capDims(req.widthPx, req.heightPx, maxEdge);
      const canvas = doc.createElement('canvas');
      const input = toRenderInput(doc, req, w, h);
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
