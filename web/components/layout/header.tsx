'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AnnouncementBar } from './announcement-bar';
import { cn } from '@/lib/utils';

export interface NavLink {
  href: string;
  label: string;
}

const DEFAULT_LINKS: NavLink[] = [
  { href: '/products', label: 'Products' },
  { href: '/create', label: 'Create' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/gallery', label: 'Gallery' },
];

/**
 * Reusable sticky site header with desktop navigation, a mobile menu, and a CTA button.
 * Composable and self-contained — pass `links`, `cta`, or hide the announcement bar.
 *
 * This is an additive building block; it does not replace the app's existing <Nav>. Wire
 * it into a layout when desired.
 */
export function Header({
  links = DEFAULT_LINKS,
  cta = { href: 'https://app.celebratebanner.com/index.html', label: 'Start Free Proof' },
  showAnnouncement = true,
  brandHref = '/',
}: {
  links?: NavLink[];
  cta?: { href: string; label: string };
  showAnnouncement?: boolean;
  brandHref?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {showAnnouncement && <AnnouncementBar />}
      <header
        className={cn(
          'sticky top-0 z-40 transition',
          scrolled ? 'border-b border-gold/15 bg-ivory/90 backdrop-blur' : 'bg-transparent',
        )}
      >
        <div className="container-page flex items-center justify-between py-4">
          <Link
            href={brandHref}
            className="font-display text-xl font-semibold tracking-tight text-obsidian"
            aria-label="CelebrateBanner home"
          >
            Celebrate<span className="text-gold">Banner</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-obsidian/80 transition hover:text-obsidian"
              >
                {l.label}
              </Link>
            ))}
            <Button asChild variant="gold" size="sm">
              <Link href={cta.href}>{cta.label}</Link>
            </Button>
          </nav>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-obsidian/15 p-2 text-obsidian md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="header-mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div
            id="header-mobile-menu"
            className="border-t border-gold/15 bg-ivory md:hidden"
          >
            <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-obsidian/85 transition hover:bg-obsidian/5"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              <Button asChild variant="gold" size="md" fullWidth className="mt-2">
                <Link href={cta.href} onClick={() => setOpen(false)}>
                  {cta.label}
                </Link>
              </Button>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
