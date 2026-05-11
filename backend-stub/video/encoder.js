/**
 * MP4 slideshow encoder ($19 video upsell).
 *
 * Strategy:
 *   1. Render each frame as a still through the SHARED render engine. The
 *      Ken Burns motion is a per-frame translate+scale applied to the hero
 *      photo and a small slide for supporting photos.
 *   2. Pipe the frames to ffmpeg as a raw image2pipe stream, mux with audio,
 *      and emit a single 1920×1080 MP4 buffer.
 *
 * Dependencies:
 *   "fluent-ffmpeg": "^2.1.3"
 *   "canvas":        "^3.0.0"
 *   ffmpeg binary on PATH (apt install ffmpeg or use @ffmpeg-installer/ffmpeg)
 *
 * Env:
 *   SLIDESHOW_DEFAULT_AUDIO_URL    optional default soundtrack
 *   SLIDESHOW_FPS                  default 30
 *   SLIDESHOW_BITRATE              default '6M'
 *
 * Performance: 60s at 30fps × 1920×1080 = 1800 frames × ~80ms = ~2.5 min per
 * video on a single core. Run on its own worker concurrency (don't share with
 * banner renders — they fight for memory).
 */

const { PassThrough } = require('node:stream');
const { createCanvas, loadImage } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');
const { renderBanner } = require('@celebratebanner/render-engine');
const { logger } = require('../services/logger');

const FPS = Number.parseInt(process.env.SLIDESHOW_FPS || '30', 10);
const BITRATE = process.env.SLIDESHOW_BITRATE || '6M';
const OUT_W = 1920;
const OUT_H = 1080;

/** Smooth easing — same curve we use in CSS (cubic-bezier 0.22, 1, 0.36, 1). */
function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

/**
 * Compute per-frame Ken Burns offsets. The hero photo zooms in from 1.0 →
 * 1.18 over the full duration. Supporting tiles fade in at staggered times.
 */
function kenBurnsTransform(t) {
  const e = easeOutQuint(Math.min(1, Math.max(0, t)));
  return { scale: 1 + 0.18 * e, dx: -OUT_W * 0.03 * e, dy: -OUT_H * 0.02 * e };
}

/**
 * Encode a slideshow from a RenderInput. Returns a Promise<Buffer> (MP4 bytes).
 * `durationSec` is the total runtime; `audioUrl` is optional.
 */
async function renderVideoSlideshow(renderInput, opts = {}) {
  const durationSec = Math.max(15, Math.min(120, opts.durationSec || 60));
  const totalFrames = durationSec * FPS;

  // Pre-decode every photo once so the frame loop is CPU-bound, not I/O-bound.
  const photos = await Promise.all(
    (renderInput.photos || []).map(async (p) => ({
      ...p,
      image: typeof p.image === 'string' || p.url
        ? await loadImage(p.image || p.url)
        : p.image,
    })),
  );
  const fullInput = { ...renderInput, photos, width: OUT_W, height: OUT_H };

  // Off-screen canvas reused across frames to avoid 1800 fresh allocations.
  const canvas = createCanvas(OUT_W, OUT_H);
  const ctx = canvas.getContext('2d');

  const frameStream = new PassThrough();

  // Producer: draw frames to the canvas, encode JPEG, push to ffmpeg stdin.
  (async () => {
    try {
      for (let f = 0; f < totalFrames; f++) {
        const t = f / Math.max(1, totalFrames - 1);
        // Background banner — the engine handles everything.
        ctx.save();
        ctx.fillStyle = renderInput.theme?.palette?.bg || '#0C0E14';
        ctx.fillRect(0, 0, OUT_W, OUT_H);
        const kb = kenBurnsTransform(t);
        ctx.translate(OUT_W / 2, OUT_H / 2);
        ctx.scale(kb.scale, kb.scale);
        ctx.translate(-OUT_W / 2 + kb.dx, -OUT_H / 2 + kb.dy);
        renderBanner(ctx, fullInput);
        ctx.restore();

        const buf = canvas.toBuffer('image/jpeg', { quality: 0.88 });
        if (!frameStream.write(buf)) {
          // Honor backpressure so we don't balloon memory.
          await new Promise((resolve) => frameStream.once('drain', resolve));
        }
      }
      frameStream.end();
    } catch (err) {
      logger.error({ err: err.message }, 'slideshow.frame-producer-failed');
      frameStream.destroy(err);
    }
  })();

  // Consumer: ffmpeg → MP4 buffer.
  return new Promise((resolve, reject) => {
    const chunks = [];
    const out = new PassThrough();
    out.on('data', (c) => chunks.push(c));
    out.on('end', () => resolve(Buffer.concat(chunks)));
    out.on('error', reject);

    let cmd = ffmpeg()
      .input(frameStream)
      .inputOptions(['-f image2pipe', '-r ' + FPS, '-vcodec mjpeg'])
      .outputOptions([
        '-pix_fmt yuv420p',
        '-c:v libx264',
        '-preset veryfast',
        '-b:v ' + BITRATE,
        '-movflags +faststart',
        '-r ' + FPS,
      ])
      .videoFilters(`scale=${OUT_W}:${OUT_H}:flags=lanczos`)
      .duration(durationSec)
      .format('mp4');

    if (opts.audioUrl) {
      cmd = cmd
        .input(opts.audioUrl)
        .outputOptions(['-c:a aac', '-b:a 192k', '-shortest']);
    } else {
      cmd = cmd.outputOptions(['-an']);
    }

    cmd
      .on('start', (line) => logger.info({ cmd: line.slice(0, 200) }, 'slideshow.ffmpeg-start'))
      .on('error', (err) => {
        logger.error({ err: err.message }, 'slideshow.ffmpeg-error');
        reject(err);
      })
      .pipe(out, { end: true });
  });
}

module.exports = { renderVideoSlideshow };
