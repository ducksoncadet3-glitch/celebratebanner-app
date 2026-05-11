'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/create', label: 'Create' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/gallery', label: 'Gallery' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition',
        scrolled ? 'border-b border-gold/15 bg-ivory/90 backdrop-blur' : 'bg-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-xl">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-obsidian text-gold">★</span>
          <span>
            Celebrate<em className="font-semibold not-italic text-gold-dark">Banner</em>
          </span>
        </Link>

        <nav className="hidden gap-7 sm:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-obsidian/80 transition hover:text-obsidian"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden sm:block">
          <Button asChild size="sm" variant="gold">
            <Link href="/create">Start designing</Link>
          </Button>
        </div>

        <button
          type="button"
          className="rounded p-2 sm:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" stroke="currentColor" fill="none" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-gold/15 bg-ivory sm:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-base font-medium hover:bg-gold/10"
              >
                {l.label}
              </Link>
            ))}
            <Button asChild size="md" variant="gold" className="mt-2">
              <Link href="/create" onClick={() => setOpen(false)}>
                Start designing
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
