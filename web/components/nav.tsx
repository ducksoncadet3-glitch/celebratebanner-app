'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { CONTACT_HREF, PRIMARY_LINKS, PROOF_CTA, SHOP_LINKS } from '@/lib/nav';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false); // mobile menu
  const [shopOpen, setShopOpen] = useState(false); // desktop Shop dropdown
  const shopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the Shop dropdown on outside click or Escape.
  useEffect(() => {
    if (!shopOpen) return;
    const onClick = (e: MouseEvent) => {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) setShopOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShopOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [shopOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition',
        scrolled ? 'border-b border-gold/15 bg-ivory/90 backdrop-blur' : 'bg-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-obsidian text-gold">★</span>
          <span>
            Celebrate<em className="font-semibold not-italic text-gold-dark">Banner</em>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {/* Shop dropdown */}
          <div ref={shopRef} className="relative">
            <button
              type="button"
              aria-expanded={shopOpen}
              aria-controls="shop-menu"
              aria-haspopup="true"
              onClick={() => setShopOpen((o) => !o)}
              className="flex items-center gap-1 text-sm font-medium text-obsidian/80 transition hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 rounded"
            >
              Shop
              <svg viewBox="0 0 20 20" className={cn('h-4 w-4 transition', shopOpen && 'rotate-180')} fill="currentColor" aria-hidden="true">
                <path d="M5.5 7.5L10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            {shopOpen && (
              <div
                id="shop-menu"
                role="menu"
                className="absolute left-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-obsidian/10 bg-white py-1.5 shadow-lift"
              >
                {SHOP_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    role="menuitem"
                    onClick={() => setShopOpen(false)}
                    className="block px-4 py-2 text-sm text-obsidian/80 transition hover:bg-gold/10 hover:text-obsidian focus-visible:bg-gold/10 focus-visible:outline-none"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {PRIMARY_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-obsidian/80 transition hover:text-obsidian">
              {l.label}
            </Link>
          ))}
          <a href={CONTACT_HREF} className="text-sm font-medium text-obsidian/80 transition hover:text-obsidian">
            Contact
          </a>
        </nav>

        <div className="hidden md:block">
          <Button asChild size="sm" variant="gold">
            <Link href={PROOF_CTA.href}>{PROOF_CTA.label}</Link>
          </Button>
        </div>

        <button
          type="button"
          className="rounded p-2 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" stroke="currentColor" fill="none" strokeWidth="2">
            {open ? <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" /> : <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu — flat list of everything */}
      {open && (
        <div className="border-t border-gold/15 bg-ivory md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            <Link href="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-base font-medium hover:bg-gold/10">
              Home
            </Link>
            <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-gold-dark">Shop</p>
            {SHOP_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-base font-medium hover:bg-gold/10">
                {l.label}
              </Link>
            ))}
            {PRIMARY_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-base font-medium hover:bg-gold/10">
                {l.label}
              </Link>
            ))}
            <a href={CONTACT_HREF} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-base font-medium hover:bg-gold/10">
              Contact
            </a>
            <Button asChild size="md" variant="gold" className="mt-2">
              <Link href={PROOF_CTA.href} onClick={() => setOpen(false)}>
                {PROOF_CTA.label}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
