/**
 * AWS S3 service.
 *
 * Dependencies:
 *   "@aws-sdk/client-s3":          "^3.700.0"
 *   "@aws-sdk/s3-presigned-post":  "^3.700.0"
 *   "@aws-sdk/s3-request-presigner": "^3.700.0"
 *
 * Env:
 *   AWS_REGION                  (us-east-1)
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   S3_BUCKET                   the uploads bucket name
 *   S3_CDN_BASE                 public CDN base URL (e.g. https://cdn.celebratebanner.com)
 *   S3_UPLOAD_TTL_SECONDS       presigned POST expiry, default 600
 *   S3_DOWNLOAD_TTL_SECONDS     signed GET URL TTL for renders, default 7 days
 */

const crypto = require('node:crypto');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.S3_BUCKET;
const CDN    = process.env.S3_CDN_BASE || `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
const UPLOAD_TTL  = Number.parseInt(process.env.S3_UPLOAD_TTL_SECONDS  || '600',   10);
const DOWNLOAD_TTL = Number.parseInt(process.env.S3_DOWNLOAD_TTL_SECONDS || `${7 * 24 * 60 * 60}`, 10);

const s3 = new S3Client({ region: REGION });

function assertConfigured() {
  if (!BUCKET) throw new Error('S3_BUCKET not configured');
}

// ── Key conventions ─────────────────────────────────────────────────────────
function uploadKey(projectId, sha256, ext) {
  return `uploads/${projectId}/${sha256.slice(0, 2)}/${sha256}${ext ? '.' + ext : ''}`;
}
function renderKey(projectId, renderId, kind) {
  // kind: png | jpeg | mockup | video
  return `renders/${projectId}/${renderId}/${kind}.${kind === 'video' ? 'mp4' : kind === 'mockup' ? 'png' : kind}`;
}
function cdnUrl(key) {
  return `${CDN}/${key}`;
}

// ── Presigned upload (browser → S3 direct) ──────────────────────────────────
/**
 * Returns a presigned POST policy the browser uses to upload directly to S3.
 * The policy enforces content-type and a size ceiling so a stolen URL can't
 * be used to upload arbitrary content.
 */
async function createUploadPolicy({ projectId, contentType, bytes, sha256 }) {
  assertConfigured();
  if (!contentType.startsWith('image/')) throw new Error('Only image uploads are allowed');
  if (bytes > 50 * 1024 * 1024) throw new Error('Upload exceeds 50 MB limit');
  const ext = contentType.split('/')[1] || 'bin';
  const key = uploadKey(projectId, sha256, ext);

  const policy = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: key,
    Conditions: [
      ['content-length-range', 1, 50 * 1024 * 1024],
      ['starts-with', '$Content-Type', 'image/'],
      { 'x-amz-meta-project': projectId },
      { 'x-amz-meta-sha256': sha256 },
    ],
    Fields: {
      'Content-Type': contentType,
      'x-amz-meta-project': projectId,
      'x-amz-meta-sha256': sha256,
    },
    Expires: UPLOAD_TTL,
  });

  return {
    url: policy.url,
    fields: policy.fields,
    bucket: BUCKET,
    key,
    assetUrl: cdnUrl(key),
    expiresAt: new Date(Date.now() + UPLOAD_TTL * 1000).toISOString(),
  };
}

// ── Server-side upload (used by the render worker) ──────────────────────────
async function putBuffer({ key, body, contentType, cacheControl }) {
  assertConfigured();
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl || 'public, max-age=31536000, immutable',
    }),
  );
  return { bucket: BUCKET, key, url: cdnUrl(key) };
}

async function deleteKey(key) {
  assertConfigured();
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

// ── Signed GET (download tokens) ────────────────────────────────────────────
async function signedGet(key, ttlSeconds) {
  assertConfigured();
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn: ttlSeconds || DOWNLOAD_TTL });
}

module.exports = {
  s3,
  uploadKey,
  renderKey,
  cdnUrl,
  createUploadPolicy,
  putBuffer,
  deleteKey,
  signedGet,
  DEFAULTS: { UPLOAD_TTL, DOWNLOAD_TTL, BUCKET, REGION, CDN },
};

// Surface init errors at boot, not first request.
if (process.env.NODE_ENV === 'production' && !BUCKET) {
  // eslint-disable-next-line no-console
  console.warn('[s3] S3_BUCKET is not set — uploads will fail');
}
