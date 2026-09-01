/** Primary navigation model — shared by the Nav component and the nav-link test. */

export interface NavLink {
  href: string;
  label: string;
}

/** Links inside the Shop dropdown (mirrors the catalog collections + an "all" entry). */
export const SHOP_LINKS: NavLink[] = [
  { href: '/shop', label: 'All Products' },
  { href: '/shop/team-banners', label: 'Team Banners' },
  { href: '/shop/graduation', label: 'Graduation' },
  { href: '/shop/championship', label: 'Championship' },
  { href: '/shop/photo-collages', label: 'Photo Collages' },
  { href: '/shop/social-graphics', label: 'Social Graphics' },
];

/** Top-level bar links besides Shop (which is a dropdown) and the CTA. */
export const PRIMARY_LINKS: NavLink[] = [{ href: '/#how-it-works', label: 'How It Works' }];

/** Contact is an email link, not an internal route (avoids a broken /contact link). */
export const CONTACT_HREF = 'mailto:info@celebratebanner.com';

export const PROOF_CTA: NavLink = { href: '/proof', label: 'Create Your Free Preview' };

/** Every INTERNAL href the nav renders — validated by the nav-link test to be non-broken. */
export const NAV_INTERNAL_HREFS: string[] = [
  '/',
  ...SHOP_LINKS.map((l) => l.href),
  ...PRIMARY_LINKS.map((l) => l.href),
  PROOF_CTA.href,
];
