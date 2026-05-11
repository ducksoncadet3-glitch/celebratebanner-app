/**
 * HD render service for celebratebanner-api.
 *
 * Uses the shared render engine (@celebratebanner/render-engine) plus
 * node-canvas (or skia-canvas — the engine is renderer-agnostic) to produce a
 * 300 DPI banner buffer. The output is a PNG (lossless, print-ready) plus a
 * JPEG (smaller, share-friendly).
 *
 * Dependencies (add to celebratebanner-api package.json):
 *   "@celebratebanner/render-engine": "file:../celebratebanner-app/shared/render-engine"
 *   "canvas": "^3.0.0"
 *
 * If you'd rather use skia-canvas for better text rendering, swap the require
 * to `skia-canvas` — the engine doesn't care which Canvas backend you use.
 */

const { createCanvas, loadImage } = require('canvas');
const { renderHD, getMockup } = require('@celebratebanner/render-engine');

/**
 * Render a banner at print resolution (default 24×36" @ 300 DPI = 7200×10800).
 * Returns { png: Buffer, jpeg: Buffer, dimensions: { width, height } }.
 *
 * @param {object} input — RenderInput-compatible shape. Photo `image` fields
 *   must be either URLs (loaded via loadImage) or already-decoded canvas Image
 *   instances. URLs are loaded in parallel before rendering.
 */
async function renderBannerHD(input, opts = {}) {
  // Hydrate any photo whose `image` is a URL/string into a canvas Image
  const photos = await Promise.all(
    (input.photos || []).map(async (p) => {
      if (p.image && typeof p.image !== 'string') return p; // already decoded
      const img = await loadImage(p.image || p.url);
      return { ...p, image: img };
    }),
  );

  const dpi = opts.dpi || 300;
  const size = opts.size || { widthIn: 24, heightIn: 36 };
  const fullW = Math.round(size.widthIn * dpi);
  const fullH = Math.round(size.heightIn * dpi);

  const canvas = createCanvas(fullW, fullH);
  renderHD(canvas, { ...input, photos }, { dpi, size });

  return {
    png: canvas.toBuffer('image/png'),
    jpeg: canvas.toBuffer('image/jpeg', { quality: 0.92 }),
    dimensions: { width: fullW, height: fullH },
    dpi,
  };
}

/**
 * Render the retractable-stand mockup at presentation resolution (~1200×1800).
 * Returns a PNG buffer.
 */
async function renderStandMockupBuffer(bannerPngBuffer) {
  const banner = await loadImage(bannerPngBuffer);
  // 600×900 logical × 2 DPR = 1200×1800 final
  const target = createCanvas(1200, 1800);
  // Wrap so the engine's RenderTarget contract is met
  const wrapped = {
    get width() { return target.width; },
    set width(v) { target.width = v; },
    get height() { return target.height; },
    set height(v) { target.height = v; },
    getContext: (kind) => target.getContext(kind),
  };
  getMockup('retractable-stand').render(wrapped, banner);
  return target.toBuffer('image/png');
}

module.exports = { renderBannerHD, renderStandMockupBuffer };
