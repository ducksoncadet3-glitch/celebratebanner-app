import { memo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

export interface ProductCardProps {
  image: string;
  title: string;
  description: string;
  href: string;
  /** Free-form availability/price line, e.g. "Available in multiple sizes and formats." */
  price?: string;
  badge?: { label: string; variant?: ComponentProps<typeof Badge>['variant'] };
  buttonText?: string;
  className?: string;
  /** Alt text for the image. Falls back to the title if omitted. */
  imageAlt?: string;
}

/**
 * Responsive product card: image, title, description, availability line, and CTA.
 * Presentational and pure → memoized (well-suited to product grids).
 * Images are lazy-loaded natively (matching the repo's <img> convention).
 */
function ProductCardImpl({
  image,
  title,
  description,
  href,
  price,
  badge,
  buttonText = 'Start Designing',
  className,
  imageAlt,
}: ProductCardProps) {
  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-obsidian/[0.08] bg-white',
        'shadow-[0_2px_12px_-6px_rgba(12,14,20,0.14)] transition duration-200 hover:-translate-y-1 hover:shadow-lift',
        className,
      )}
    >
      <div className="relative flex items-center justify-center bg-obsidian p-3">
        {badge && (
          <span className="absolute left-3 top-3 z-10">
            <Badge variant={badge.variant ?? 'featured'}>{badge.label}</Badge>
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={imageAlt ?? title}
          loading="lazy"
          decoding="async"
          className="h-auto w-full rounded-lg object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-sans text-base font-semibold text-obsidian sm:text-lg">{title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-obsidian/60">{description}</p>
        {price && <p className="mt-3 text-sm font-medium text-gold-dark">{price}</p>}
        <Link
          href={href}
          className={cn(
            'mt-5 inline-flex items-center justify-center gap-2 self-start rounded-full',
            'bg-gradient-to-br from-gold to-gold-light px-5 py-2.5 text-sm font-semibold text-obsidian shadow-gold transition',
            'hover:from-gold-light hover:to-gold',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
          )}
          aria-label={`${buttonText}: ${title}`}
        >
          {buttonText}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export const ProductCard = memo(ProductCardImpl);
