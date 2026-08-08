import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { serverApi } from './api';

/**
 * The web app owns NO email-provider credential and never supplies a recipient. Order
 * confirmation forwards ONLY the Stripe session id to the backend (single Postmark mailer)
 * over the authenticated server-to-server channel; the backend derives the recipient.
 */
describe('serverApi().sendOrderConfirmation', () => {
  const OLD_ENV = { ...process.env };

  beforeEach(() => {
    process.env.API_INTERNAL_BASE_URL = 'http://api.internal';
    process.env.API_SHARED_SECRET = 'shh-internal';
  });

  afterEach(() => {
    process.env = { ...OLD_ENV };
    vi.restoreAllMocks();
  });

  it('POSTs only the session id + internal secret to the backend, and returns { sent }', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ sent: true }), { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await serverApi().sendOrderConfirmation({ sessionId: 'cs_test_123' });
    expect(res).toEqual({ sent: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.internal/api/emails/order-confirmation');
    expect(init).toBeDefined();
    expect(init!.method).toBe('POST');

    const headers = new Headers(init!.headers);
    expect(headers.get('x-internal-secret')).toBe('shh-internal');

    // Only the session id is forwarded — no recipient address is ever sent from the web tier.
    const forwarded = JSON.parse(init!.body as string);
    expect(forwarded).toEqual({ sessionId: 'cs_test_123' });
    expect(forwarded.email).toBeUndefined();
    expect(forwarded.to).toBeUndefined();
  });

  it('never targets a third-party email provider (Postmark-only, backend-mediated)', async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify({ sent: false }), { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await serverApi().sendOrderConfirmation({ sessionId: 'cs_test_123' });
    const url = fetchMock.mock.calls[0][0];
    expect(url).not.toMatch(/resend\.com/);
    expect(url).not.toMatch(/postmarkapp\.com/); // credential + provider live on the backend, not here
  });
});
