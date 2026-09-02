'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { api, type ReadyMadeDelivery } from '@/lib/api';

/**
 * The delivery surface for a paid ready-made order.
 *
 * A ready-made purchase renders nothing, so there is no progress to report and no render row
 * to derive a link from — this asks the server for a fresh, short-lived download
 * authorization for THIS paid order and shows the button. The customer keeps the emailed
 * link too: the two are separate authorizations against the same secure token system, so
 * using one never invalidates the other.
 */
export function ReadyMadeDeliveryPanel({
  projectId,
  sessionId,
  productName,
}: {
  projectId: string;
  sessionId?: string;
  productName?: string;
}) {
  const [delivery, setDelivery] = useState<ReadyMadeDelivery | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getReadyMadeDelivery(projectId, { sessionId })
      .then((d) => { if (!cancelled) setDelivery(d); })
      // Never leave the customer staring at a spinner: the emailed link is still valid, so
      // say so rather than failing silently.
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [projectId, sessionId]);

  const name = delivery?.productName || productName;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-sage/30 bg-white p-8 text-center shadow-lift">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sage/15 text-2xl text-sage">
          ✓
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-sage">
          Payment received
        </p>
        <h1 className="mt-3 text-balance text-4xl sm:text-5xl">
          Thank you — your artwork is ready.
        </h1>
        {name ? <p className="mt-3 text-xl text-obsidian/80">{name}</p> : null}
        <p className="mt-2 text-obsidian/70">Your purchase is complete.</p>
        <p className="mt-3 text-pretty text-obsidian/70">
          Download your artwork below. We&apos;ve also sent a secure download link to your email.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-gold/30 bg-ivory p-6 text-center">
        {delivery === null && !failed ? (
          <div className="flex items-center justify-center gap-3">
            <Spinner />
            <p className="text-sm text-obsidian/70">Preparing your download…</p>
          </div>
        ) : null}

        {delivery?.available && delivery.downloadUrl ? (
          <>
            <Button asChild variant="gold">
              <a href={delivery.downloadUrl} download>
                ⬇ Download Your Artwork
              </a>
            </Button>
            <p className="mt-3 text-xs text-obsidian/55">
              This link is private and expires — save the file to your device. The link in your
              email stays valid for 7 days.
            </p>
          </>
        ) : null}

        {delivery && !delivery.available ? (
          <p className="text-sm text-obsidian/75">{delivery.message}</p>
        ) : null}

        {failed ? (
          <p className="text-sm text-obsidian/75">
            We couldn&apos;t prepare your download link just now — the secure link in your email
            still works. Reload this page to try again.
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="gold">
          <Link href="/shop">Discover More CelebrateBanner Designs</Link>
        </Button>
        <Button asChild variant="ghost">
          <a href="https://www.celebratebanner.com/">Continue Shopping</a>
        </Button>
      </div>
    </div>
  );
}
