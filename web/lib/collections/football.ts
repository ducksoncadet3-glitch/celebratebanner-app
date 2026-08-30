import type { CollectionData } from './types';

/**
 * Football Collection content. All copy is data here so the page JSX stays declarative
 * and future collections can follow the same shape.
 *
 * Product visuals are brand-consistent inline-SVG placeholder posters (no external
 * assets, no network, no 404s). Swap `poster(...)` for real photography under /public
 * when available.
 */

/**
 * Primary conversion path: Football Collection → /proof → /create.
 * Every CTA routes through the Free Design Proof wizard (which hands off into the builder),
 * so customers see a free preview before the builder. Passing a product slug deep-links that
 * product as preselected in the wizard (/proof?product=<slug>).
 */
const proofHref = (product?: string) => (product ? `/proof?product=${product}` : '/proof');

/** Build a small on-brand SVG poster as a data-URI (obsidian → gold, with a label). */
function poster(label: string, sub: string, aspect: '4x5' | '16x9' = '4x5'): string {
  const [w, h] = aspect === '16x9' ? [1600, 900] : [900, 1125];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#0C0E14"/><stop offset="0.6" stop-color="#1B1F2C"/><stop offset="1" stop-color="#13161F"/>
</linearGradient>
<radialGradient id="glow" cx="0.7" cy="0.15" r="0.8">
<stop offset="0" stop-color="#C9A84C" stop-opacity="0.28"/><stop offset="0.6" stop-color="#C9A84C" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<rect width="${w}" height="${h}" fill="url(#glow)"/>
<rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="#C9A84C" stroke-opacity="0.35" stroke-width="3" rx="16"/>
<text x="${w / 2}" y="${h / 2 - 10}" fill="#F5E4B0" font-family="Georgia, serif" font-size="${aspect === '16x9' ? 72 : 66}" font-weight="700" text-anchor="middle">${label}</text>
<text x="${w / 2}" y="${h / 2 + 46}" fill="#FAF8F3" fill-opacity="0.7" font-family="system-ui, sans-serif" font-size="26" letter-spacing="6" text-anchor="middle">${sub.toUpperCase()}</text>
<text x="${w / 2}" y="${h - 56}" fill="#C9A84C" fill-opacity="0.85" font-family="system-ui, sans-serif" font-size="20" letter-spacing="3" text-anchor="middle">SAMPLE DESIGN</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const footballCollection: CollectionData = {
  slug: 'football',
  seo: {
    title: 'Football Banners & Posters',
    description:
      'Personalized football banners, posters, and social graphics — team rosters, senior night, championships, and player spotlights. Built from your team photos with a free preview before you order.',
    path: '/football',
    ogImage: '/og-default.png',
  },

  hero: {
    title: 'Football Collection',
    subtitle:
      'Celebrate your team, your seniors, and your season with personalized banners, posters, and social graphics — built from your own photos and team colors.',
    backgroundImage: poster('FOOTBALL', 'One Team · One Goal', '16x9'),
    primaryCTA: { href: proofHref(), label: 'Create Your Design' },
    secondaryCTA: { href: '#packages', label: 'View Packages' },
  },

  intro: {
    eyebrow: 'The Football Collection',
    heading: 'Everything your program needs to celebrate the season',
    body: 'From full-roster team banners to senior night tributes and championship posters, every design is personalized with your athletes, colors, and messaging — and you see a free preview before you order.',
  },

  products: [
    {
      id: 'team-roster-banner',
      title: 'Team Roster Banner',
      description: 'A landscape banner featuring your full roster and coaches, with a hero photo and player grid.',
      format: 'Printed',
      image: poster('EAGLES', 'Team Roster'),
      imageAlt: 'Football team roster banner sample design with a hero photo and player grid, marked "SAMPLE DESIGN."',
      href: proofHref('team-roster-banner'),
      badge: { label: 'Most Popular', variant: 'featured' },
    },
    {
      id: 'senior-night-banner',
      title: 'Senior Night Banner',
      description: 'Spotlight a graduating senior with their photo, number, position, and years played.',
      format: 'Both',
      image: poster('SENIORS', 'Senior Night'),
      imageAlt: 'Football senior night banner sample design spotlighting a graduating athlete, marked "SAMPLE DESIGN."',
      href: proofHref('senior-night-banner'),
    },
    {
      id: 'championship-poster',
      title: 'Championship Poster',
      description: 'Commemorate a title run with a bold poster — team name, record, and roster.',
      format: 'Both',
      image: poster('CHAMPIONS', 'Title Season'),
      imageAlt: 'Football championship poster sample design with a trophy motif and title year, marked "SAMPLE DESIGN."',
      href: proofHref('championship-poster'),
    },
    {
      id: 'player-spotlight-poster',
      title: 'Player Spotlight Poster',
      description: 'A personalized poster for a standout player — action photo, stats, and name.',
      format: 'Both',
      image: poster('#11 SMITH', 'Player Spotlight'),
      imageAlt: 'Football player spotlight poster sample design with an action photo and stats, marked "SAMPLE DESIGN."',
      href: proofHref('player-spotlight-poster'),
    },
    {
      id: 'coach-recognition-banner',
      title: 'Coach Recognition Banner',
      description: 'Honor a coach\'s season, leadership, and years of service with a tribute banner.',
      format: 'Printed',
      image: poster('COACH', 'Recognition'),
      imageAlt: 'Football coach recognition banner sample design honoring a head coach, marked "SAMPLE DESIGN."',
      href: proofHref('coach-recognition-banner'),
    },
    {
      id: 'football-social-graphics',
      title: 'Football Social Graphics',
      description: 'Square, share-ready graphics for game-day announcements and player features.',
      format: 'Digital',
      image: poster('GAME DAY', 'Social Graphic'),
      imageAlt: 'Football social graphic sample design sized for Instagram, marked "SAMPLE DESIGN."',
      href: proofHref('football-social-graphics'),
    },
  ],

  packages: [
    {
      id: 'season-pack',
      name: 'Team Season Pack',
      tagline: 'For the whole program',
      note: 'Available in multiple sizes and formats.',
      features: [
        'Team roster banner',
        'Matching social graphics',
        'Your team colors & logo-free design',
        'Free preview before you order',
      ],
      href: proofHref('team-roster-banner'),
      ctaLabel: 'Build the Season Pack',
    },
    {
      id: 'senior-night-pack',
      name: 'Senior Night Pack',
      tagline: 'Honor every senior',
      note: 'Available in multiple sizes and formats.',
      features: [
        'Individual senior banners',
        'A senior night group banner',
        'Printed & digital options',
        'Free preview before you order',
      ],
      href: proofHref('senior-night-banner'),
      ctaLabel: 'Build the Senior Night Pack',
      popular: true,
    },
    {
      id: 'championship-pack',
      name: 'Championship Pack',
      tagline: 'Celebrate the title',
      note: 'Available in multiple sizes and formats.',
      features: [
        'Championship poster',
        'Championship social graphic',
        'Roster & record personalization',
        'Free preview before you order',
      ],
      href: proofHref('championship-poster'),
      ctaLabel: 'Build the Championship Pack',
    },
  ],

  process: [
    { title: 'Choose a design', description: 'Start from a football layout built for teams and players.' },
    { title: 'Upload your photos', description: 'Add your athletes, coaches, and team colors.' },
    { title: 'Personalize', description: 'Enter names, numbers, records, and messaging.' },
    { title: 'See your free preview', description: 'See your personalized design — free, before you order.' },
    { title: 'Approve & order', description: 'Approve the design and choose printed, digital, or both.' },
  ],

  trust: [
    { icon: '✓', title: 'Free preview first', description: 'See and approve your design before you pay — no payment required to preview.' },
    { icon: '🎨', title: 'Your colors & photos', description: 'Every design is personalized with your team\'s colors, athletes, and messaging.' },
    { icon: '🖨️', title: 'Printed & digital', description: 'Choose a ready-to-hang printed banner, a digital file, or both.' },
    { icon: '⚡', title: 'Made in minutes', description: 'A fast online flow gets you from photos to a finished design quickly.' },
  ],

  faqs: [
    {
      q: 'Do I pay anything before I see my design?',
      a: 'No. You can choose a design, upload photos, personalize it, and preview your design for free. Payment happens only if you choose to order.',
    },
    {
      q: 'Can I use my team\'s colors and photos?',
      a: 'Yes. Every product is personalized with your team\'s colors, your athletes\' photos, and your own names, numbers, and messaging.',
    },
    {
      q: 'Can I order printed banners, digital files, or both?',
      a: 'Both. Most products are available as a printed keepsake, a digital file for social and screens, or both — you choose at checkout.',
    },
    {
      q: 'Do you use team logos or player likenesses?',
      a: 'Designs are built from the photos and text you provide. We do not add licensed team logos or third-party marks.',
    },
    {
      q: 'Can I order for the whole team or just one player?',
      a: 'Either. Start with a single player or senior, or use a package to cover the full roster and season.',
    },
  ],

  finalCta: {
    heading: 'Ready to celebrate your season?',
    body: 'Start with a free design preview — no payment required to see it. Approve when it\'s exactly right.',
    cta: { href: proofHref(), label: 'Create Your Design' },
  },
};
