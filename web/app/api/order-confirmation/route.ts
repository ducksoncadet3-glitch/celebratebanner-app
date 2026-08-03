import { NextResponse } from 'next/server';

/**
 * Order-confirmation email integration point.
 *
 * There is no first-party email infrastructure in this repo yet, so this handler is the
 * seam where it plugs in — without touching unrelated code. Behavior:
 *
 *   • If an email provider is configured (RESEND_API_KEY), send a confirmation email.
 *   • Otherwise, log the intent and no-op (Stripe still sends its own payment receipt),
 *     returning { sent: false } so the success page degrades gracefully.
 *
 * The client calls this fire-and-forget via api.sendOrderConfirmation and never blocks on it.
 */

export const runtime = 'nodejs';

interface Body {
  email?: unknown;
  sessionId?: unknown;
  projectId?: unknown;
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* empty / invalid JSON → treated as missing email below */
  }

  const email = str(body.email);
  if (!email) {
    return NextResponse.json({ sent: false, error: 'email is required' }, { status: 400 });
  }

  const sessionId = str(body.sessionId);
  const projectId = str(body.projectId);

  try {
    const sent = await deliverConfirmationEmail({ email, sessionId, projectId });
    return NextResponse.json({ sent });
  } catch {
    // A confirmation failure must never surface as a checkout failure.
    return NextResponse.json({ sent: false });
  }
}

interface ConfirmationPayload {
  email: string;
  sessionId?: string;
  projectId?: string;
}

/**
 * Actual delivery. Swap/extend this single function when first-party email infra lands.
 * Returns true only if an email was actually dispatched.
 */
async function deliverConfirmationEmail(payload: ConfirmationPayload): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ORDER_CONFIRMATION_FROM ?? 'CelebrateBanner <orders@celebratebanner.com>';

  if (!apiKey) {
    // No provider configured → graceful no-op. Left as the documented integration point.
    // eslint-disable-next-line no-console
    console.log('[order-confirmation] email provider not configured; skipping send', {
      email: payload.email,
      sessionId: payload.sessionId,
      projectId: payload.projectId,
    });
    return false;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: payload.email,
      subject: 'Your CelebrateBanner order is confirmed 🎉',
      text:
        'Thank you for your order!\n\n' +
        'Your payment was received and your banner is being prepared. ' +
        'You will receive your download links (and shipping updates, if applicable) shortly.\n\n' +
        (payload.projectId ? `Order reference: ${payload.projectId}\n` : '') +
        '\n— The CelebrateBanner team',
    }),
  });

  return res.ok;
}
