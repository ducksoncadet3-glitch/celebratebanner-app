import Link from 'next/link';

export interface FooterLink {
  href: string;
  label: string;
}
export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: 'Products',
    links: [
      { href: '/products', label: 'Product Catalog' },
      { href: '/create', label: 'Create a Banner' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/gallery', label: 'Gallery' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/#how-it-works', label: 'How It Works' },
      { href: '/gallery', label: 'Showcase' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/#faq', label: 'FAQ' },
      { href: 'mailto:info@celebratebanner.com', label: 'Contact' },
      { href: '/#free-proof', label: 'Free Proof' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/refunds', label: 'Refund Policy' },
    ],
  },
];

/**
 * Reusable four-column site footer (Products / Company / Support / Legal).
 * Additive building block; does not replace the app's existing <Footer>.
 */
export function Footer({
  columns = DEFAULT_COLUMNS,
  tagline = 'Luxury celebration banners, designed in minutes.',
}: {
  columns?: FooterColumn[];
  tagline?: string;
}) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gold/15 bg-obsidian text-ivory">
      <div className="container-page py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <p className="font-display text-2xl">
              Celebrate<em className="font-semibold not-italic text-gold">Banner</em>
            </p>
            <p className="mt-3 max-w-xs text-sm text-ivory/65">{tagline}</p>
          </div>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold/80">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link href={l.href} className="text-ivory/75 transition hover:text-ivory">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-ivory/10 pt-6 text-xs text-ivory/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} CelebrateBanner. All rights reserved.</p>
          <p>
            West Palm Beach, FL ·{' '}
            <a
              href="mailto:info@celebratebanner.com"
              className="underline-offset-2 hover:underline"
            >
              info@celebratebanner.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
