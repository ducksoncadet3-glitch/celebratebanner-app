/**
 * Image optimization pipeline (sharp-based).
 *
 * For every uploaded photo we generate two variants alongside the original:
 *
 *   • thumb_*.webp   — 256 px wide, q70, used in the upload tray + admin UI
 *   • medium_*.webp  — 1280 px wide, q82, used by /create live preview (so the
 *                       preview canvas decodes a 1280px image, not a 24MP one)
 *
 * The retained original is re-encoded in place WITHOUT metadata (see normalizeOriginal) so
 * no EXIF/GPS is kept in long-term storage (Privacy Policy §1). Pixels + orientation are
 * preserved; only the metadata is dropped. Print-quality renders use this cleaned original.
 *
 * Triggered by an S3 ObjectCreated event (or polled from the upload route as
 * a fallback). Updates `uploads.thumb_url` + `uploads.medium_url`.
 *
 * Dependencies:
 *   "sharp": "^0.33.5"
 *   AWS SDK already required by services/s3.js
 *
 * Memory: sharp streams; peaks ~150 MB for a 24MP input. Cap concurrency to
 * IMAGE_OPT_CONCURRENCY (default 4) so a burst of uploads doesn't OOM the API.
 */

const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3, putBuffer, DEFAULTS } = require('./s3');
const { query } = require('../db/index');
const { logger } = require('./logger');
const { metrics } = require('./metrics');

let sharp;
try {
  sharp = require('sharp');
} catch {
  // Optional dependency — pipeline degrades to "no variants" if missing.
  sharp = null;
}

const VARIANTS = [
  { name: 'thumb',  width: 256,  quality: 70 },
  { name: 'medium', width: 1280, quality: 82 },
];

const MAX_CONCURRENCY = Number.parseInt(process.env.IMAGE_OPT_CONCURRENCY || '4', 10);
let inFlight = 0;
const waiters = [];

function acquire() {
  if (inFlight < MAX_CONCURRENCY) { inFlight++; return Promise.resolve(); }
  return new Promise((resolve) => waiters.push(() => { inFlight++; resolve(); }));
}
function release() {
  inFlight--;
  const next = waiters.shift();
  if (next) next();
}

async function fetchOriginal(bucket, key) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const res = await s3.send(cmd);
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/**
 * Re-encode the stored original at the SAME key WITHOUT metadata, so no EXIF/GPS is retained
 * in long-term customer image storage (Privacy Policy §1). sharp drops input metadata unless
 * withMetadata() is called (we never call it); .rotate() bakes in EXIF orientation first so
 * the image still displays correctly. With bucket versioning enabled, the metadata-bearing
 * version becomes noncurrent and is purged by the lifecycle's NoncurrentVersionExpiration.
 */
async function normalizeOriginal(s3Key, original) {
  const pipeline = sharp(original).rotate();
  let body;
  let contentType;
  if (/\.png$/i.test(s3Key)) {
    body = await pipeline.png().toBuffer();
    contentType = 'image/png';
  } else if (/\.webp$/i.test(s3Key)) {
    body = await pipeline.webp({ quality: 90 }).toBuffer();
    contentType = 'image/webp';
  } else {
    body = await pipeline.jpeg({ quality: 92 }).toBuffer();
    contentType = 'image/jpeg';
  }
  await putBuffer({ key: s3Key, body, contentType, cacheControl: 'public, max-age=31536000, immutable' });
}

/**
 * Optimize a single uploaded image. Idempotent — safe to call repeatedly.
 * Returns the URLs of the generated variants.
 */
async function optimize({ projectId, s3Key, bucket }) {
  if (!sharp) {
    logger.warn({ s3Key }, 'image-opt.sharp-missing');
    return null;
  }

  await acquire();
  const t0 = Date.now();
  try {
    const original = await fetchOriginal(bucket || DEFAULTS.BUCKET, s3Key);
    const out = {};
    for (const v of VARIANTS) {
      const variantKey = s3Key.replace(/\.(jpe?g|png|webp)$/i, `.${v.name}.webp`);
      const buf = await sharp(original)
        .rotate()                       // honor EXIF orientation
        .resize({ width: v.width, withoutEnlargement: true })
        .webp({ quality: v.quality })
        .toBuffer();
      const result = await putBuffer({
        key: variantKey,
        body: buf,
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
      });
      out[v.name] = result.url;
    }

    // Persist variant URLs on the uploads row.
    await query(
      `UPDATE uploads
          SET thumb_url  = $1,
              medium_url = $2
        WHERE project_id = $3 AND s3_key = $4`,
      [out.thumb, out.medium, projectId, s3Key],
    );

    // Strip EXIF/GPS from the retained original (best-effort; a failure here must not fail
    // the whole optimize pass — the variants are already saved).
    try {
      await normalizeOriginal(s3Key, original);
    } catch (err) {
      logger.warn({ err: err.message, s3Key }, 'image-opt.normalize-failed');
    }

    logger.info({ projectId, s3Key, ms: Date.now() - t0 }, 'image-opt.done');
    return out;
  } catch (err) {
    logger.error({ err: err.message, s3Key }, 'image-opt.failed');
    return null;
  } finally {
    release();
  }
}

module.exports = { optimize };
