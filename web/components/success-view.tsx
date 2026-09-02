'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { ProcessingStatus } from './processing-status';
import { ReadyMadeDeliveryPanel } from './success/ready-made-delivery';
import { api } from '@/lib/api';
import { logOperationalEvent } from '@/lib/orders/events';
import { getStoredEmail } from '@/lib/utils';

export function SuccessView() {
  const search = useSearchParams();
  const sessionId = search.get('session_id') ?? '';
  const projectId = search.get('project_id') ?? '';
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  // Which product was bought decides the entire page. Unknown until the server answers —
  // and we must not guess, because guessing "personalized" tells a ready-made buyer their
  // artwork is rendering when nothing is being rendered.
  const [mode, setMode] = useState<'ready-made' | 'personalized' | null>(null);
  const [productName, setProductName] = useState<string | undefined>(undefined);
  const confirmationSent = useRef(false);

  useEffect(() => {
    setEmail(getStoredEmail());
  }, []);

  // Fire the order-confirmation email integration point once, after a confirmed payment.
  // Fire-and-forget: never blocks or breaks the success page (Stripe sends its own receipt).
  // We send ONLY the Stripe session id — the backend verifies it, derives the recipient from
  // the stored payment, and de-duplicates, so no email address leaves the browser here.
  useEffect(() => {
    if (confirmationSent.current) return;
    if (!sessionId) return; // the payment credential is required to send
    confirmationSent.current = true;
    logOperationalEvent({
      orderId: projectId || sessionId,
      scope: 'payment',
      message: 'Payment confirmed; customer reached success page',
      actor: 'customer',
      metadata: { sessionId },
    });
    void api.sendOrderConfirmation({ sessionId });
  }, [sessionId, projectId]);

  // One status read, purely to learn the product mode. ProcessingStatus does its own
  // polling for personalized orders; this never starts a second poll loop.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    api
      .getProjectStatus(projectId, { sessionId })
      .then((s) => {
        if (cancelled) return;
        setMode(s.productMode === 'ready-made' ? 'ready-made' : 'personalized');
        setProductName(s.productName);
      })
      // A failed read must not strand the customer: fall back to the render flow, which is
      // what every order was before ready-made products existed.
      .catch(() => { if (!cancelled) setMode('personalized'); });
    return () => { cancelled = true; };
  }, [projectId, sessionId]);

  if (!sessionId && !projectId) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-gold/30 bg-white p-10 text-center">
        <h1 className="text-3xl">No order to show.</h1>
        <p className="mt-2 text-obsidian/65">
          We couldn&apos;t find your session. If you just paid, please check your email for the receipt.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/create">Design another banner</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (projectId && mode === 'ready-made') {
    return (
      <ReadyMadeDeliveryPanel
        projectId={projectId}
        sessionId={sessionId || undefined}
        productName={productName}
      />
    );
  }

  // Mode still unknown: show the payment confirmation, but nothing that claims to know what
  // happens next. This is a fraction of a second, and it is honest for both product kinds.
  if (projectId && mode === null) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-sage/30 bg-white p-8 text-center shadow-lift">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage/15 text-2xl text-sage">
            ✓
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-sage">
            Payment received
          </p>
          <h1 className="mt-3 text-balance text-4xl sm:text-5xl">Thank you — you&apos;re all set.</h1>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Spinner />
            <p className="text-sm text-obsidian/70">Fetching your order…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-sage/30 bg-white p-8 text-center shadow-lift">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage/15 text-2xl text-sage">
          ✓
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-sage">
          Payment received
        </p>
        <h1 className="mt-3 text-balance text-4xl sm:text-5xl">Thank you — you&apos;re all set.</h1>
        <p className="mt-3 text-pretty text-obsidian/70">
          {email
            ? <>A receipt is on its way to <strong>{email}</strong>. Your banner is rendering now and the download links will appear right here.</>
            : <>A receipt is on its way to the email you used at checkout. Your banner is rendering now and the download links will appear right here.</>}
        </p>
      </div>

      {projectId ? (
        <div className="mt-6">
          <ProcessingStatus
            projectId={projectId}
            sessionId={sessionId}
            onReady={(s) => {
              if (s.downloadUrl) setReadyUrl(s.downloadUrl);
              if (s.videoUrl) setVideoUrl(s.videoUrl);
            }}
          />
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gold/20 bg-white p-5">
          <Spinner />
          <p className="text-sm text-obsidian/70">
            Confirming with our server… you&apos;ll get an email the moment your files are ready.
          </p>
        </div>
      )}

      {(readyUrl || videoUrl) && (
        <div className="mt-6 rounded-2xl border border-gold/30 bg-ivory p-6">
          <h2 className="text-xl">Your downloads</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {readyUrl && (
              <Button asChild variant="gold">
                <a href={readyUrl} download>
                  ⬇ Download Your Artwork
                </a>
              </Button>
            )}
            {videoUrl && (
              <Button asChild variant="primary">
                <a href={videoUrl} download>
                  ⬇ Download video slideshow
                </a>
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-obsidian/55">
            Links are private and expire after 7 days — save the files to your device.
          </p>
        </div>
      )}

      {/* Post-purchase: keep the customer in the CelebrateBanner world. Works for a
          rendered order and a ready-made artwork alike. */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="gold">
          <Link href="/shop">Discover More CelebrateBanner Designs</Link>
        </Button>
        <Button asChild variant="ghost">
          <a href="https://www.celebratebanner.com/">Continue Shopping</a>
        </Button>
      </div>
      <div className="mt-4 text-center">
        <Button asChild variant="ghost">
          <Link href="/create">Design another banner</Link>
        </Button>
      </div>
    </div>
  );
}
