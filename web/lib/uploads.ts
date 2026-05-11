/**
 * Direct-to-S3 upload client.
 *
 * Two-step flow:
 *   1. POST /api/uploads/signed → backend returns { url, fields, assetUrl }
 *      where `url` + `fields` are a presigned POST policy.
 *   2. Browser POSTs the file directly to S3 → no upload bytes touch our API.
 *
 * Benefits:
 *   • Originals preserved at full resolution (no re-encoding through the API).
 *   • API server doesn't OOM on a 50×50MB upload batch.
 *   • CDN-ready paths (assetUrl is the CloudFront URL once the bucket is fronted).
 *
 * Failures are reported per-file; partial success is normal.
 */

import { api, ApiError } from './api';
import type { PhotoMeta } from './render-input.schema';

export interface SignedUploadPolicy {
  url: string;
  fields: Record<string, string>;
  assetUrl: string;     // canonical CDN URL the file will be served from
  expiresAt: string;    // ISO timestamp
}

export interface UploadProgress {
  fileId: string;
  filename: string;
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadResult {
  ok: boolean;
  photo?: PhotoMeta;
  error?: string;
}

/**
 * Hash a file's bytes with the WebCrypto API for sha256 idempotency.
 * Used so re-uploading the same file is a no-op on the backend.
 */
export async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}

/** Read width/height of an image File without a network round-trip. */
export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const out = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('not an image'));
    };
    img.src = url;
  });
}

/**
 * Upload a single file to S3 using a presigned POST policy. Reports progress
 * via the optional callback. Returns the final PhotoMeta (or an error).
 */
export async function uploadFile(
  projectId: string,
  file: File,
  onProgress?: (p: UploadProgress) => void,
): Promise<UploadResult> {
  try {
    const sha256 = await sha256Hex(file);
    const dims = await readImageDimensions(file);
    const policy = await api.requestSignedUpload({
      projectId,
      filename: file.name,
      contentType: file.type,
      bytes: file.size,
      sha256,
      width: dims.width,
      height: dims.height,
    });

    await postToS3(policy, file, (loaded, total) => {
      onProgress?.({
        fileId: sha256.slice(0, 12),
        filename: file.name,
        loaded,
        total,
        percent: total > 0 ? Math.round((loaded / total) * 100) : 0,
      });
    });

    return {
      ok: true,
      photo: {
        id: sha256.slice(0, 32),
        url: policy.assetUrl,
        width: dims.width,
        height: dims.height,
        bytes: file.size,
        sha256,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof ApiError ? err.message : (err as Error).message };
  }
}

/** Upload many files concurrently with a small worker pool to avoid hammering S3. */
export async function uploadMany(
  projectId: string,
  files: File[],
  onProgress?: (p: UploadProgress) => void,
  concurrency = 4,
): Promise<UploadResult[]> {
  const queue = files.slice();
  const results: UploadResult[] = new Array(files.length);
  let index = 0;
  async function worker() {
    while (queue.length > 0) {
      const f = queue.shift();
      if (!f) return;
      const i = index++;
      results[i] = await uploadFile(projectId, f, onProgress);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker));
  return results;
}

// ── Internal helpers ─────────────────────────────────────────────────────────
function postToS3(
  policy: SignedUploadPolicy,
  file: File,
  onProgress: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', policy.url);
    if (xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(e.loaded, e.total);
      };
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed (${xhr.status}): ${xhr.responseText.slice(0, 200)}`));
    };
    xhr.onerror = () => reject(new Error('S3 upload network error'));
    const form = new FormData();
    Object.entries(policy.fields).forEach(([k, v]) => form.append(k, v));
    form.append('file', file);
    xhr.send(form);
  });
}
