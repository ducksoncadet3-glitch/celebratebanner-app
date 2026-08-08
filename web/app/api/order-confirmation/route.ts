import { NextResponse } from 'next/server';
import { serverApi } from '@/lib/api';

/**
 * Order-confirmation email integration point (same-origin).
 *
 * The browser calls this fire-and-forget from the success page (api.sendOrderConfirmation)
 * and never blocks on it. This handler does NOT send email itself — CelebrateBanner has a
 * single transactional-email provider (Postmark) behind the backend API. This route is a
 * thin, server-side proxy that forwards to the backend over the existing authenticated
 * server-to-server channel (serverApi → x-internal-secret), so no email-provider credential
 * is ever present in the web app or exposed to the browser.
 *
 * SECURITY: the only accepted input is the Stripe Checkout session id. The backend verifies
 * it against the stored payment and derives the recipient/order reference itself — the
 * browser cannot supply or influence the recipient, so this cannot be used as an email relay.
 * The backend also de-duplicates, so repeated calls send at most one email per paid order.
 *
 * If the backend is unreachable or not configured to send, we degrade gracefully and return
 * { sent: false } — Stripe still sends its own payment receipt.
 */

export const runtime = 'nodejs';

interface Body {
  sessionId?: unknown;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty / invalid JSON → treated as missing sessionId below */
  }

  const sessionId = str(body.sessionId);
  if (!sessionId) {
    return NextResponse.json({ sent: false, error: 'sessionId is required' }, { status: 400 });
  }

  try {
    const { sent } = await serverApi().sendOrderConfirmation({ sessionId });
    return NextResponse.json({ sent });
  } catch {
    // A confirmation failure must never surface as a checkout/success failure.
    return NextResponse.json({ sent: false });
  }
}
