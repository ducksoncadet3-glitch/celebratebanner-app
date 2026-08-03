'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Routes where a floating "Start Free Design Proof" would be redundant or intrusive. */
const HIDDEN_PREFIXES = ['/proof', '/create', '/checkout', '/success', '/cancel', '/admin'];

/**
 * Floating conversion CTA. Fixed so it stays visible while scrolling: bottom-center on
 * mobile, bottom-right on desktop. Hidden on the proof/builder/checkout/admin flows so it
 * never competes with those pages' own actions. Links into the EXISTING proof flow.
 */
export function StickyProofCta() {
  const pathname = usePathname() ?? '/';
  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-4 sm:inset-x-auto sm:right-6 sm:px-0">
      <div className="mx-auto flex max-w-max sm:mx-0">
        <Link
          href="/proof"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-gold to-gold-light px-6 py-3 text-sm font-semibold text-obsidian shadow-lift ring-1 ring-obsidian/5 transition hover:from-gold-light hover:to-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          aria-label="Start a free design proof"
        >
          Start Free Design Proof
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
