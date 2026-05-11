/**
 * Typed client for the celebratebanner-api backend.
 *
 * Two flavors are exported:
 *   • `api`         — works in the browser, talks to NEXT_PUBLIC_API_BASE_URL
 *   • `serverApi`   — works in Server Components / Route Handlers and can use
 *                     the internal API_INTERNAL_BASE_URL (e.g. private VPC URL)
 *                     plus an API_SHARED_SECRET header for service-to-service auth.
 *
 * No Stripe secret keys are ever referenced here. The backend creates Checkout
 * Sessions and returns a redirect URL; the browser never sees a secret.
 */

import type { ProductId, RenderType } from './pricing';

const PUBLIC_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

// ── Shared types ─────────────────────────────────────────────────────────────
export interface CheckoutLineItem {
  productId: ProductId;
  quantity?: number;
}

export interface CreateCheckoutInput {
  projectId: string;
  templateId: string;
  renderType: RenderType;
  customerEmail: string;
  items: CheckoutLineItem[];
  /** Optional discount code applied by the user. */
  couponCode?: string;
  /** Optional affiliate referral code captured from the URL. */
  affiliateRef?: string;
  /** Optional cart-recovery token returned by abandoned-cart emails. */
  recoveryToken?: string;
}

export interface CreateCheckoutResponse {
  /** Stripe Checkout URL — caller redirects window.location to this. */
  url: string;
  /** Stripe Checkout Session id (cs_...) — used by /success to poll status. */
  sessionId: string;
}

export interface ProjectStatus {
  projectId: string;
  status: 'pending' | 'paid' | 'rendering' | 'ready' | 'failed' | 'refunded';
  renderProgress?: number; // 0..100 while rendering
  downloadUrl?: string;    // signed URL, present once status === 'ready'
  videoUrl?: string;       // present when video upsell included
  expiresAt?: string;      // ISO timestamp for the signed URLs
  errorMessage?: string;
}

export interface UploadedPhoto {
  id: string;
  url: string;
  width: number;
  height: number;
  dpi: number;
  bytes: number;
}

// ── Error helper ─────────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { base?: string; json?: unknown } = {},
): Promise<T> {
  const base = init.base ?? PUBLIC_BASE;
  if (!base) {
    throw new ApiError('API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL.', 0);
  }
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
    body,
    // Default cache: no-store so we never serve stale checkout sessions or
    // download URLs from a CDN edge.
    cache: init.cache ?? 'no-store',
  });
  if (!res.ok) {
    let parsed: unknown;
    try { parsed = await res.json(); } catch { /* ignore */ }
    const message =
      (parsed && typeof parsed === 'object' && 'error' in parsed && typeof (parsed as any).error === 'string'
        ? (parsed as any).error
        : `Request failed (${res.status})`);
    throw new ApiError(message, res.status, parsed);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── Public (browser-safe) endpoints ─────────────────────────────────────────
export const api = {
  /** POST /api/payments/checkout → returns Stripe Checkout URL to redirect to. */
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResponse> {
    return request<CreateCheckoutResponse>('/api/payments/checkout', {
      method: 'POST',
      json: input,
    });
  },

  /** GET /api/projects/:id/status — used by /success to poll render progress. */
  getProjectStatus(projectId: string): Promise<ProjectStatus> {
    return request<ProjectStatus>(`/api/projects/${encodeURIComponent(projectId)}/status`);
  },

  /**
   * POST /api/uploads/signed — exchange file metadata for a presigned S3 POST
   * policy. The browser then uploads directly to S3 (no API bytes).
   */
  requestSignedUpload(input: {
    projectId: string;
    filename: string;
    contentType: string;
    bytes: number;
    sha256: string;
    width: number;
    height: number;
  }): Promise<{
    url: string;
    fields: Record<string, string>;
    assetUrl: string;
    expiresAt: string;
  }> {
    return request('/api/uploads/signed', { method: 'POST', json: input });
  },

  /**
   * PATCH /api/projects/:id — autosave the canonical RenderInput. Versioned;
   * the server rejects payloads whose `version` field is unknown.
   */
  saveProject(projectId: string, body: { renderInput: unknown; rev: number }): Promise<{ rev: number }> {
    return request<{ rev: number }>(`/api/projects/${encodeURIComponent(projectId)}`, {
      method: 'PATCH',
      json: body,
    });
  },
};

// ── Server-only helper (Route Handlers / Server Components) ─────────────────
export function serverApi() {
  const base = process.env.API_INTERNAL_BASE_URL ?? PUBLIC_BASE;
  const secret = process.env.API_SHARED_SECRET;
  return {
    getProjectStatus(projectId: string): Promise<ProjectStatus> {
      return request<ProjectStatus>(`/api/projects/${encodeURIComponent(projectId)}/status`, {
        base,
        headers: secret ? { 'x-internal-secret': secret } : undefined,
      });
    },
  };
}
