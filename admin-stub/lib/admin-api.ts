/**
 * Typed client against celebratebanner-api admin endpoints.
 * Server-only — never import this from a client component without confirming
 * the bearer token lives in an HttpOnly cookie or server-side env.
 */

const BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || process.env.ADMIN_API_BASE_URL;
const BEARER = process.env.ADMIN_BEARER_TOKEN;

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE) throw new Error('ADMIN_API_BASE_URL not configured');
  const headers = new Headers(init.headers);
  if (BEARER) headers.set('Authorization', `Bearer ${BEARER}`);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const res = await fetch(`${BASE}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) throw new Error(`Admin API ${res.status} on ${path}`);
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export interface Overview {
  totals: { projects: number; paid: number; rendering: number; ready: number; failed: number; refunded: number };
  revenue: { last24hCents: number; last7dCents: number; last30dCents: number };
  queue: { waiting: number; active: number; failed: number };
}
export interface ProjectRow {
  id: string;
  customerEmail: string | null;
  templateId: string;
  arrangement: string;
  status: string;
  createdAt: string;
  paidAt: string | null;
}
export interface ProjectDetail extends ProjectRow {
  renderInput: unknown;
  rev: number;
  renders: Array<{ id: string; status: string; progress: number; durationMs: number | null; createdAt: string; errorMessage: string | null }>;
  payments: Array<{ id: string; amountTotalCents: number; productIds: string[]; status: string; createdAt: string }>;
}
export interface QueueSnapshot {
  waiting: number;
  active: number;
  failed: number;
  completed: number;
  delayed: number;
  failedJobs: Array<{ id: string; reason: string; failedAt: string; data: { projectId: string } }>;
}
export interface PaymentRow {
  id: string;
  projectId: string | null;
  amountTotalCents: number;
  currency: string;
  productIds: string[];
  status: string;
  customerEmail: string | null;
  createdAt: string;
}

export const adminApi = {
  overview:        ()                       => req<Overview>('/api/admin/overview'),
  listProjects:    (q: { status?: string; q?: string }) =>
    req<ProjectRow[]>(`/api/admin/projects?${new URLSearchParams(Object.entries(q).filter(([, v]) => !!v) as [string, string][]).toString()}`),
  getProject:      (id: string)             => req<ProjectDetail>(`/api/admin/projects/${encodeURIComponent(id)}`),
  rerender:        (id: string)             => req<{ jobId: string }>(`/api/admin/projects/${encodeURIComponent(id)}/rerender`, { method: 'POST' }),
  refund:          (id: string, amountCents?: number) =>
    req<{ ok: true }>(`/api/admin/projects/${encodeURIComponent(id)}/refund`, { method: 'POST', body: JSON.stringify({ amountCents }) }),
  queue:           ()                       => req<QueueSnapshot>('/api/admin/queue'),
  retryJob:        (id: string)             => req<{ ok: true }>(`/api/admin/queue/${encodeURIComponent(id)}/retry`, { method: 'POST' }),
  cancelJob:       (id: string)             => req<{ ok: true }>(`/api/admin/queue/${encodeURIComponent(id)}/cancel`, { method: 'POST' }),
  listPayments:    (q: { email?: string })  =>
    req<PaymentRow[]>(`/api/admin/payments?${new URLSearchParams(Object.entries(q).filter(([, v]) => !!v) as [string, string][]).toString()}`),
};
