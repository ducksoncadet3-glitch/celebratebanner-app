/**
 * POST /api/render/preview
 *
 * Server-side preview endpoint. The browser uses the shared render engine
 * directly for live preview (zero server roundtrip), so this route exists
 * only for non-browser surfaces — email previews, OG-image generation,
 * the dashboard, social cards, etc.
 *
 * Body: a RenderInput-compatible JSON (photos must be URLs the server can fetch).
 * Returns: image/jpeg @ 800×1200.
 */

const { createCanvas, loadImage } = require('canvas');
const { renderPreview } = require('@celebratebanner/render-engine');

async function previewHandler(req, res) {
  try {
    const input = req.body;
    if (!input || !Array.isArray(input.photos)) {
      return res.status(400).json({ error: 'invalid body' });
    }
    const photos = await Promise.all(
      input.photos.map(async (p) => ({
        ...p,
        image: typeof p.image === 'string' ? await loadImage(p.image) : p.image,
      })),
    );
    const canvas = createCanvas(800, 1200);
    renderPreview(canvas, { ...input, photos });
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
    canvas.toBuffer('image/jpeg', { quality: 0.85 }).then(
      (buf) => res.status(200).send(buf),
      (err) => res.status(500).json({ error: err.message }),
    );
  } catch (err) {
    console.error('[preview] failed', err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { previewHandler };
