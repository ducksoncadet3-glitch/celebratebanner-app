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

/** Physical shipping address, collected on the Order Review page for print orders. */
export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  /** ISO-3166-1 alpha-2 country code (e.g. "US"). */
  country: string;
}

export interface CreateCheckoutInput {
  projectId: string;
  templateId: string;
  renderType: RenderType;
  customerEmail: string;
  items: CheckoutLineItem[];
  /** Optional customer name for the order record / shipping label. */
  customerName?: string;
  /** Optional shipping address — sent only for products that require shipping.
   *  Additive + backward compatible: the backend ignores it for digital orders. */
  shipping?: ShippingAddress;
  /** Optional discount code applied by the user. */
  couponCode?: string;
  /** Optional affiliate referral code captured from the URL. */
  affiliateRef?: string;
  /** Optional cart-recovery token returned by abandoned-cart emails. */
  recoveryToken?: string;
}

/** Payload for the order-confirmation email integration point (same-origin route). */
export interface OrderConfirmationInput {
  email: string;
  sessionId?: string;
  projectId?: string;
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

  /**
   * GET /api/projects/:id/status — used by /success to poll render progress.
   *
   * The route is authorized: pass whichever project-scoped credential the caller holds —
   * the owner's `projectToken` (from autosave) and/or the Stripe `sessionId` (present on
   * the /success page, verified against the payment record). At least one is required.
   */
  getProjectStatus(
    projectId: string,
    opts: { projectToken?: string; sessionId?: string } = {},
  ): Promise<ProjectStatus> {
    const qs = opts.sessionId ? `?session_id=${encodeURIComponent(opts.sessionId)}` : '';
    return request<ProjectStatus>(`/api/projects/${encodeURIComponent(projectId)}/status${qs}`, {
      headers: opts.projectToken ? { 'x-project-token': opts.projectToken } : undefined,
    });
  },

  /**
   * POST /api/order-confirmation — fire-and-forget confirmation-email trigger.
   * This hits our OWN same-origin Next route handler (not the external API), which
   * sends the email if a provider is configured and otherwise no-ops gracefully.
   * Never throws to the caller: a failed confirmation must not break the success page.
   */
  async sendOrderConfirmation(input: OrderConfirmationInput): Promise<{ sent: boolean }> {
    try {
      const res = await fetch('/api/order-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(input),
        cache: 'no-store',
      });
      if (!res.ok) return { sent: false };
      return (await res.json()) as { sent: boolean };
    } catch {
      return { sent: false };
    }
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
   * PATCH /api/projects/:id — autosave the canonical RenderInput. Versioned (rev
   * optimistic-concurrency).
   *
   * Authorized write: send the owner's `projectToken` if we already hold one. The very
   * first save for a brand-new project has no token yet — the server claims the project
   * (trust-on-first-use) and returns a `projectToken` the caller must persist and send on
   * every subsequent save. Once a project is claimed, saves without the token are rejected.
   */
  saveProject(
    projectId: string,
    body: { renderInput: unknown; rev: number },
    projectToken?: string,
  ): Promise<{ rev: number; projectToken?: string }> {
    return request<{ rev: number; projectToken?: string }>(
      `/api/projects/${encodeURIComponent(projectId)}`,
      {
        method: 'PATCH',
        json: body,
        headers: projectToken ? { 'x-project-token': projectToken } : undefined,
      },
    );
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
