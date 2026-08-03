import { memo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface PackageCardProps {
  name: string;
  tagline?: string;
  /** Free-form availability line — never a hardcoded price. */
  note?: string;
  features: string[];
  href: string;
  ctaLabel?: string;
  /** Highlights the card and shows a "Popular" badge. */
  popular?: boolean;
  className?: string;
}

/**
 * A bundle/package card: name, tagline, included features, and a CTA. Pure and
 * presentational, so it is memoized (well-suited to package grids).
 */
function PackageCardImpl({
  name,
  tagline,
  note,
  features,
  href,
  ctaLabel = 'Get Started',
  popular = false,
  className,
}: PackageCardProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border bg-white p-6 sm:p-7',
        'shadow-[0_2px_12px_-6px_rgba(12,14,20,0.14)] transition duration-200 hover:-translate-y-1 hover:shadow-lift',
        popular ? 'border-gold ring-1 ring-gold/40' : 'border-obsidian/[0.08]',
        className,
      )}
    >
      {popular && (
        <span className="absolute -top-3 left-6">
          <Badge variant="featured">Popular</Badge>
        </span>
      )}
      <h3 className="font-display text-2xl font-semibold text-obsidian">{name}</h3>
      {tagline && <p className="mt-1 text-sm text-obsidian/60">{tagline}</p>}
      <ul className="mt-5 flex-1 space-y-2.5" role="list">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-obsidian/80">
            <span className="mt-0.5 shrink-0 text-gold-dark" aria-hidden="true">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {note && <p className="mt-5 text-xs italic text-obsidian/45">{note}</p>}
      <Link
        href={href}
        className={cn(
          'mt-5 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
          popular
            ? 'bg-gradient-to-br from-gold to-gold-light text-obsidian shadow-gold hover:from-gold-light hover:to-gold'
            : 'bg-obsidian text-gold-pale shadow-lift hover:bg-obsidian-50',
        )}
        aria-label={`${ctaLabel}: ${name}`}
      >
        {ctaLabel}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

export const PackageCard = memo(PackageCardImpl);
