import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CollectionCTA {
  href: string;
  label: string;
}

export interface CollectionHeroProps {
  title: string;
  subtitle?: string;
  /** Optional background image URL; rendered behind a dark overlay for legibility. */
  backgroundImage?: string;
  primaryCTA?: CollectionCTA;
  secondaryCTA?: CollectionCTA;
  className?: string;
}

/**
 * Collection landing hero with an optional background image, title, subtitle, and up to
 * two CTAs. Always renders dark (obsidian) for premium contrast; the background image is
 * lazy-loaded and decorative (aria-hidden).
 */
export function CollectionHero({
  title,
  subtitle,
  backgroundImage,
  primaryCTA,
  secondaryCTA,
  className,
}: CollectionHeroProps) {
  return (
    <section
      className={cn('relative overflow-hidden bg-obsidian text-ivory', className)}
      aria-labelledby="collection-hero-title"
    >
      {backgroundImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgroundImage}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-obsidian/50 via-obsidian/70 to-obsidian"
            aria-hidden="true"
          />
        </>
      )}
      <div className="container-page relative py-20 sm:py-28">
        <div className="max-w-2xl">
          <h1
            id="collection-hero-title"
            className="font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ivory/80">{subtitle}</p>
          )}
          {(primaryCTA || secondaryCTA) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryCTA && (
                <Button asChild variant="gold" size="lg">
                  <Link href={primaryCTA.href}>{primaryCTA.label}</Link>
                </Button>
              )}
              {secondaryCTA && (
                <Button
                  asChild
                  size="lg"
                  className="border border-ivory/30 bg-transparent text-ivory hover:border-gold hover:text-gold"
                >
                  <Link href={secondaryCTA.href}>{secondaryCTA.label}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
