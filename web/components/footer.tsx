import Link from 'next/link';

interface FooterLink {
  href: string;
  label: string;
  /** External (marketing-site) link — rendered as a plain <a>, not prefetched by Next. */
  external?: boolean;
}

const COL_PRODUCT: FooterLink[] = [
  { href: '/create', label: 'Create a banner' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/gallery', label: 'Gallery' },
];

// Blog removed: no blog route exists yet (avoid an empty/fake blog).
const COL_COMPANY: FooterLink[] = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

// Terms & Privacy point to the approved canonical pages on the marketing site
// (verified HTTP 200). Refund policy removed pending an approved page — no live
// route or approved content exists, and legal copy must not be fabricated.
const COL_LEGAL: FooterLink[] = [
  { href: 'https://www.celebratebanner.com/terms', label: 'Terms', external: true },
  { href: 'https://www.celebratebanner.com/privacy', label: 'Privacy', external: true },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gold/15 bg-obsidian text-ivory">
      <div className="container-page py-14">
        <div className="grid gap-10 sm:grid-cols-4">
          <div>
            <p className="font-display text-2xl">
              Celebrate<em className="font-semibold not-italic text-gold">Banner</em>
            </p>
            <p className="mt-3 text-sm text-ivory/65">
              Luxury celebration banners, designed in minutes. A CDN4 LLC product.
            </p>
          </div>
          <FooterCol title="Product" items={COL_PRODUCT} />
          <FooterCol title="Company" items={COL_COMPANY} />
          <FooterCol title="Legal" items={COL_LEGAL} />
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-ivory/10 pt-6 text-xs text-ivory/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} CDN4 LLC dba CelebrateBanner. All rights reserved.</p>
          <p>
            211 Old Okeechobee Road, Bay 2 #1058, West Palm Beach, FL 33401 ·{' '}
            <a href="mailto:info@celebratebanner.com" className="underline-offset-2 hover:underline">
              info@celebratebanner.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: FooterLink[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold/80">{title}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.href}>
            {i.external ? (
              <a
                href={i.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory/75 transition hover:text-ivory"
              >
                {i.label}
              </a>
            ) : (
              <Link href={i.href} className="text-ivory/75 transition hover:text-ivory">
                {i.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
