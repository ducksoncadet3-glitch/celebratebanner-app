import { formatUSD, PRICING } from '@/lib/pricing';
import { poster, type PosterAspect } from './poster';
import type {
  Collection,
  CollectionSlug,
  DeliveryType,
  Product,
  ProductFaq,
  ProductSpec,
  ProductType,
  ProofProductKey,
} from './types';

/**
 * CENTRALIZED PRODUCT CATALOG — single source of truth for the storefront.
 *
 * Copy is intentionally credible and conservative: no invented reviews, ratings, delivery
 * guarantees, or unconfirmed production specs. Where exact options are unknown we say
 * "Available options are shown during customization." Confirmed facts only (300 DPI, CMYK,
 * PDF+JPG, 24×36 / 18×24 sizes) come from the repo's existing product docs.
 */

// ── Shared spec/size defaults (confirmed facts only) ─────────────────────────
const SPECS_PRINT: ProductSpec[] = [
  { label: 'Resolution', value: '300 DPI, print-ready' },
  { label: 'Color', value: 'CMYK' },
  { label: 'Files', value: 'PDF + JPG' },
  { label: 'Personalization', value: 'Your photos, colors & text' },
];
const SPECS_DIGITAL: ProductSpec[] = [
  { label: 'Resolution', value: 'High-resolution digital' },
  { label: 'Files', value: 'PNG + JPG' },
  { label: 'Personalization', value: 'Your photos, colors & text' },
];
const SPECS_BOTH: ProductSpec[] = [
  { label: 'Resolution', value: '300 DPI, print-ready' },
  { label: 'Formats', value: 'Printed or instant digital download' },
  { label: 'Files', value: 'PDF + JPG' },
  { label: 'Personalization', value: 'Your photos, colors & text' },
];

const SIZES: Record<ProductType, string[]> = {
  banner: ['24×36 in', '18×24 in'],
  poster: ['18×24 in', '24×36 in'],
  collage: ['24×36 in', '18×24 in'],
  'yard-sign': ['18×24 in'],
  'social-graphic': [],
  'social-pack': [],
};

const DEFAULT_ASPECT: Record<ProductType, PosterAspect> = {
  banner: '16x9',
  poster: '4x5',
  collage: '16x9',
  'yard-sign': '4x5',
  'social-graphic': '1x1',
  'social-pack': '1x1',
};

export function deliveryLabel(d: DeliveryType): string {
  return d === 'both' ? 'Printed & digital' : d === 'printed' ? 'Printed & shipped' : 'Instant digital download';
}

/**
 * Delivery-aware price line — always exactly what checkout can charge (see lib/pricing.ts):
 *   • both      → "Print from $79.99 · Digital $9.99" (both options shown)
 *   • printed   → "$79.99" (single flat price, no "From")
 *   • digital   → "$9.99"
 */
export function priceLabelFor(d: DeliveryType): string {
  const print = formatUSD(PRICING.print.amountCents); // $79.99
  const digital = formatUSD(PRICING.digital.amountCents); // $9.99
  if (d === 'both') return `Print from ${print} · Digital ${digital}`;
  if (d === 'digital') return digital;
  return print; // printed-only
}

const COMMON_FAQ: ProductFaq[] = [
  {
    q: 'Do I pay before I see my design?',
    a: 'No. Create your free preview — pick a product, add your photos, and personalize your design, then see it in the builder before you decide. You only pay if you choose to order or download.',
  },
  {
    q: 'What sizes and formats are available?',
    a: 'Available options are shown during customization, so you can pick what fits your celebration before ordering.',
  },
];

// ── Factory ──────────────────────────────────────────────────────────────────
interface Seed {
  slug: string;
  name: string;
  collectionSlug: CollectionSlug;
  category: string;
  productType: ProductType;
  deliveryType: DeliveryType;
  startingPriceCents: number;
  proofProductKey: ProofProductKey;
  ctaLabel?: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  faq?: ProductFaq[];
  sportTags?: string[];
  occasionTags: string[];
  seoTitle: string;
  seoDescription: string;
  posterLabel: string;
  posterSub: string;
  badge?: string;
  featured?: boolean;
  bestSeller?: boolean;
}

function specsFor(d: DeliveryType): ProductSpec[] {
  return d === 'digital' ? SPECS_DIGITAL : d === 'printed' ? SPECS_PRINT : SPECS_BOTH;
}

function build(seed: Seed): Product {
  const aspect = DEFAULT_ASPECT[seed.productType];
  const image = poster(seed.posterLabel, seed.posterSub, aspect);
  return {
    slug: seed.slug,
    name: seed.name,
    shortDescription: seed.shortDescription,
    fullDescription: seed.fullDescription,
    category: seed.category,
    collectionSlug: seed.collectionSlug,
    startingPriceCents: seed.startingPriceCents,
    priceLabel: priceLabelFor(seed.deliveryType),
    image,
    gallery: [image],
    badge: seed.badge,
    featured: seed.featured,
    bestSeller: seed.bestSeller,
    productType: seed.productType,
    deliveryType: seed.deliveryType,
    availableSizes: SIZES[seed.productType],
    features: seed.features,
    specifications: specsFor(seed.deliveryType),
    faq: [...(seed.faq ?? []), ...COMMON_FAQ],
    relatedProductSlugs: [], // filled after all products are defined
    proofProductKey: seed.proofProductKey,
    ctaLabel: seed.ctaLabel,
    sportTags: seed.sportTags ?? [],
    occasionTags: seed.occasionTags,
    seoTitle: seed.seoTitle,
    seoDescription: seed.seoDescription,
  };
}

const SPORTS = ['football', 'basketball', 'soccer', 'baseball', 'volleyball'];

// ── Collections ──────────────────────────────────────────────────────────────
export const COLLECTIONS: Collection[] = [
  {
    slug: 'team-banners',
    name: 'Team Banners',
    tagline: 'Celebrate your whole roster',
    description:
      'Personalized banners and posters for your team, seniors, coaches, and standout players — built from your own photos and colors.',
    heroLabel: 'TEAM',
    seoTitle: 'Team Banners & Posters',
    seoDescription:
      'Custom team banners, senior night banners, coach appreciation, and player spotlights — personalized from your team photos with a free design preview.',
  },
  {
    slug: 'graduation',
    name: 'Graduation',
    tagline: 'Honor the graduate',
    description:
      'Banners, posters, yard signs, and social graphics to celebrate your graduate — personalized with their name, year, school, and photos.',
    heroLabel: 'GRAD',
    seoTitle: 'Graduation Banners, Posters & Yard Signs',
    seoDescription:
      'Custom graduation banners, posters, yard signs, and social graphics personalized with your graduate’s photos — free design preview before you order.',
  },
  {
    slug: 'championship',
    name: 'Championship',
    tagline: 'Commemorate the title',
    description:
      'Championship banners, posters, and celebration graphics to mark a title run — personalized with your team name, record, and roster.',
    heroLabel: 'CHAMPS',
    seoTitle: 'Championship Banners & Posters',
    seoDescription:
      'Custom championship banners, posters, MVP prints, and celebration graphics personalized with your team’s title season — free design preview first.',
  },
  {
    slug: 'photo-collages',
    name: 'Photo Collages',
    tagline: 'Your memories, one artwork',
    description:
      'Turn travel, family, and life photos into one premium personalized collage — a hero photo surrounded by the moments that go with it.',
    heroLabel: 'MEMORIES',
    seoTitle: 'Personalized Photo Collages & Memory Artwork',
    seoDescription:
      'Turn your favorite travel, family, and vacation photos into one premium personalized photo collage. Free design preview before you order.',
  },
  {
    slug: 'social-graphics',
    name: 'Social Graphics',
    tagline: 'Share-ready in minutes',
    description:
      'Game-day, final-score, player features, and announcement graphics sized for social — personalized with your team’s photos and colors.',
    heroLabel: 'SOCIAL',
    seoTitle: 'Team Social Media Graphics',
    seoDescription:
      'Custom game day, final score, player of the game, schedule, and announcement graphics for social media — personalized and ready to share.',
  },
];

// ── Products ─────────────────────────────────────────────────────────────────
const SEEDS: Seed[] = [
  // TEAM COLLECTION
  {
    slug: 'team-banner', name: 'Team Banner', collectionSlug: 'team-banners', category: 'Banner',
    productType: 'banner', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'team-roster-banner',
    badge: 'Best Seller', bestSeller: true, featured: true,
    shortDescription: 'A landscape banner featuring your full roster, coaches, and a hero photo.',
    fullDescription:
      'Rally the whole program around one banner. Add your roster, coaches, and a hero photo, then personalize the colors and headline to match your team. See your design free before you order.',
    features: ['Full roster and coaches', 'Hero photo with supporting grid', 'Your team colors & headline', 'Logo-free, likeness-safe design'],
    occasionTags: ['team', 'season', 'game-day'], sportTags: SPORTS,
    seoTitle: 'Custom Team Banner', seoDescription: 'Personalized team banner with your full roster, coaches, and colors. Start a free design preview — no payment required.',
    posterLabel: 'EAGLES', posterSub: 'Team Roster',
  },
  {
    slug: 'senior-night-banner', name: 'Senior Night Banner', collectionSlug: 'team-banners', category: 'Banner',
    productType: 'banner', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'senior-night-banner',
    badge: 'Most Popular', featured: true,
    shortDescription: 'Spotlight a graduating senior with their photo, number, and years played.',
    fullDescription:
      'Give your seniors the send-off they earned. Feature each athlete’s photo, number, position, and years played on a banner built for the moment. Preview your personalized design for free.',
    features: ['Senior photo, number & position', 'Years-played and tribute text', 'Your team colors', 'Great for game-day and keepsakes'],
    occasionTags: ['senior-night', 'team', 'celebration'], sportTags: SPORTS,
    seoTitle: 'Senior Night Banner', seoDescription: 'Personalized senior night banner spotlighting your graduating athlete. Free design preview — pay only when you love it.',
    posterLabel: 'SENIORS', posterSub: 'Senior Night',
  },
  {
    slug: 'team-poster', name: 'Team Poster', collectionSlug: 'team-banners', category: 'Poster',
    productType: 'poster', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'team-roster-banner',
    shortDescription: 'A compact team poster — your roster and hero photo, ready for the wall.',
    fullDescription:
      'The team banner in a wall-friendly poster size. Feature your roster and a hero photo, personalized with your colors and headline. Free preview before you order.',
    features: ['Roster and hero photo', 'Your team colors', 'Wall-ready poster size', 'Digital option for sharing'],
    occasionTags: ['team', 'season'], sportTags: SPORTS,
    seoTitle: 'Custom Team Poster', seoDescription: 'Personalized team poster with your roster and colors. Start a free design preview — no payment required.',
    posterLabel: 'EAGLES', posterSub: 'Team Poster',
  },
  {
    slug: 'coach-appreciation-banner', name: 'Coach Appreciation Banner', collectionSlug: 'team-banners', category: 'Banner',
    productType: 'banner', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'coach-recognition-banner',
    shortDescription: 'Honor a coach’s season, leadership, and years of service.',
    fullDescription:
      'Say thank you the right way. Celebrate your coach with a personalized banner featuring their photo, a message from the team, and your colors. Preview it free first.',
    features: ['Coach photo & tribute message', 'Signed-by-the-team feel', 'Your team colors', 'Perfect for end-of-season'],
    occasionTags: ['appreciation', 'team', 'end-of-season'], sportTags: SPORTS,
    seoTitle: 'Coach Appreciation Banner', seoDescription: 'Personalized coach appreciation banner honoring your coach’s season. Free design preview before you order.',
    posterLabel: 'COACH', posterSub: 'Thank You',
  },
  {
    slug: 'player-spotlight-banner', name: 'Player Spotlight Banner', collectionSlug: 'team-banners', category: 'Banner',
    productType: 'banner', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'player-spotlight-poster',
    shortDescription: 'A standout-player banner with an action photo, number, and name.',
    fullDescription:
      'Put one athlete center stage. Feature an action photo, name, and number on a bold banner personalized with your team colors. See your free preview before you pay.',
    features: ['Action photo & name', 'Number and position', 'Your team colors', 'Digital option for socials'],
    occasionTags: ['player', 'team', 'game-day'], sportTags: SPORTS,
    seoTitle: 'Player Spotlight Banner', seoDescription: 'Personalized player spotlight banner with an action photo and stats. Free design preview — pay only when ready.',
    posterLabel: '#11 SMITH', posterSub: 'Player Spotlight',
  },
  {
    slug: 'team-photo-collage', name: 'Team Photo Collage', collectionSlug: 'team-banners', category: 'Collage',
    productType: 'collage', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'team-roster-banner',
    shortDescription: 'A photo collage of your season — many moments on one keepsake.',
    fullDescription:
      'Turn a season of photos into one keepsake. Add your favorite team moments and we’ll arrange them into a clean collage personalized with your colors. Free preview first.',
    features: ['Multiple photos, one layout', 'Season-long moments', 'Your team colors', 'Printed keepsake or digital file'],
    occasionTags: ['team', 'season', 'keepsake'], sportTags: SPORTS,
    seoTitle: 'Team Photo Collage', seoDescription: 'Personalized team photo collage of your season. Start a free design preview — no payment required.',
    posterLabel: 'THE SEASON', posterSub: 'Team Collage',
  },

  // GRADUATION COLLECTION
  {
    slug: 'graduation-banner', name: 'Graduation Banner', collectionSlug: 'graduation', category: 'Banner',
    productType: 'banner', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'graduation-banner',
    badge: 'Best Seller', bestSeller: true, featured: true,
    shortDescription: 'Celebrate your graduate with their name, year, school, and photos.',
    fullDescription:
      'Mark the milestone with a banner made for the graduate. Add their name, class year, school, and favorite photos, personalized with your colors. Preview it free before ordering.',
    features: ['Graduate name, year & school', 'Hero photo and supporting shots', 'Your colors & headline', 'Printed keepsake or digital file'],
    occasionTags: ['graduation', 'celebration', 'party'],
    seoTitle: 'Custom Graduation Banner', seoDescription: 'Personalized graduation banner with your graduate’s name, year, and photos. Free design preview — pay only when you love it.',
    posterLabel: 'CLASS OF 2026', posterSub: 'Graduation',
  },
  {
    slug: 'graduation-poster', name: 'Graduation Poster', collectionSlug: 'graduation', category: 'Poster',
    productType: 'poster', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'graduation-banner',
    featured: true,
    shortDescription: 'A wall-ready graduation poster personalized with your graduate’s photo.',
    fullDescription:
      'A poster-sized tribute for your graduate. Feature their photo, name, and year in a clean, celebratory layout personalized with your colors. See your free preview first.',
    features: ['Graduate photo, name & year', 'Clean celebratory layout', 'Your colors', 'Digital option for sharing'],
    occasionTags: ['graduation', 'party', 'keepsake'],
    seoTitle: 'Graduation Poster', seoDescription: 'Personalized graduation poster with your graduate’s photo and year. Start a free design preview — no payment required.',
    posterLabel: 'SARAH J.', posterSub: 'Graduate 2026',
  },
  {
    slug: 'graduation-yard-sign', name: 'Graduation Yard Sign', collectionSlug: 'graduation', category: 'Yard Sign',
    productType: 'yard-sign', deliveryType: 'printed', startingPriceCents: 7999, proofProductKey: 'graduation-banner',
    shortDescription: 'A personalized yard sign to announce your graduate at home.',
    fullDescription:
      'Announce your graduate from the front lawn. A personalized yard sign with their photo, name, and year — designed to be seen and celebrated. Preview your design free.',
    features: ['Graduate photo, name & year', 'Bold, readable-from-the-street layout', 'Your colors', 'Great for grad parties'],
    occasionTags: ['graduation', 'party', 'yard-sign'],
    seoTitle: 'Graduation Yard Sign', seoDescription: 'Personalized graduation yard sign with your graduate’s photo and year. Free design preview before you order.',
    posterLabel: 'GRAD 2026', posterSub: 'Yard Sign',
  },
  {
    slug: 'graduation-social-graphic', name: 'Graduation Social Graphic', collectionSlug: 'graduation', category: 'Social Graphic',
    productType: 'social-graphic', deliveryType: 'digital', startingPriceCents: 999, proofProductKey: 'graduation-banner',
    shortDescription: 'A share-ready graduation graphic for social media.',
    fullDescription:
      'Announce the good news online. A personalized graduation graphic sized for social, featuring your graduate’s photo, name, and year. Free preview before you download.',
    features: ['Sized for social sharing', 'Graduate photo, name & year', 'Your colors', 'Instant digital download'],
    occasionTags: ['graduation', 'social', 'announcement'],
    seoTitle: 'Graduation Social Graphic', seoDescription: 'Personalized graduation social media graphic with your graduate’s photo. Free design preview — instant digital download.',
    posterLabel: 'WE DID IT', posterSub: 'Grad Social',
  },
  {
    slug: 'graduation-welcome-banner', name: 'Graduation Party Welcome Banner', collectionSlug: 'graduation', category: 'Banner',
    productType: 'banner', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'graduation-banner',
    shortDescription: 'A welcome banner to greet guests at the graduation party.',
    fullDescription:
      'Set the scene for the celebration. A personalized welcome banner featuring your graduate’s photo and name to greet party guests. Preview your design free first.',
    features: ['“Welcome” headline & graduate name', 'Hero photo', 'Your party colors', 'Printed keepsake or digital file'],
    occasionTags: ['graduation', 'party', 'welcome'],
    seoTitle: 'Graduation Welcome Banner', seoDescription: 'Personalized graduation party welcome banner with your graduate’s photo. Free design preview before you order.',
    posterLabel: 'WELCOME', posterSub: 'Grad Party',
  },
  {
    slug: 'graduation-memory-collage', name: 'Graduation Memory Collage', collectionSlug: 'graduation', category: 'Collage',
    productType: 'collage', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'graduation-banner',
    shortDescription: 'A photo collage tracing your graduate’s journey to the stage.',
    fullDescription:
      'From first day to graduation day. Add photos across the years and we’ll arrange them into a memory collage personalized with your colors. See your free preview first.',
    features: ['Multiple photos across the years', 'Clean collage layout', 'Your colors', 'Printed keepsake or digital file'],
    occasionTags: ['graduation', 'keepsake', 'memory'],
    seoTitle: 'Graduation Memory Collage', seoDescription: 'Personalized graduation memory collage of your graduate’s journey. Start a free design preview — no payment required.',
    posterLabel: 'THE JOURNEY', posterSub: 'Grad Collage',
  },

  // CHAMPIONSHIP COLLECTION
  {
    slug: 'championship-banner', name: 'Championship Banner', collectionSlug: 'championship', category: 'Banner',
    productType: 'banner', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'championship-poster',
    badge: 'Best Seller', bestSeller: true, featured: true,
    shortDescription: 'Commemorate a title with your team name, record, and roster.',
    fullDescription:
      'Hang the season on the wall. A championship banner personalized with your team name, record, and roster, in your colors. Preview your design free before you order.',
    features: ['Team name, record & roster', 'Bold championship layout', 'Your team colors', 'Printed keepsake or digital file'],
    occasionTags: ['championship', 'celebration', 'team'], sportTags: SPORTS,
    seoTitle: 'Championship Banner', seoDescription: 'Personalized championship banner with your team name, record, and roster. Free design preview — pay only when ready.',
    posterLabel: 'CHAMPIONS', posterSub: 'Title Season',
  },
  {
    slug: 'championship-poster', name: 'Championship Poster', collectionSlug: 'championship', category: 'Poster',
    productType: 'poster', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'championship-poster',
    shortDescription: 'A wall-ready championship poster with your title year and roster.',
    fullDescription:
      'The championship banner in poster size. Feature your team name, title year, and roster in a bold layout personalized with your colors. Free preview first.',
    features: ['Team name & title year', 'Roster and record', 'Your team colors', 'Digital option for sharing'],
    occasionTags: ['championship', 'team', 'keepsake'], sportTags: SPORTS,
    seoTitle: 'Championship Poster', seoDescription: 'Personalized championship poster with your title year and roster. Start a free design preview — no payment required.',
    posterLabel: '2026 CHAMPS', posterSub: 'Champion Poster',
  },
  {
    slug: 'tournament-champion-banner', name: 'Tournament Champion Banner', collectionSlug: 'championship', category: 'Banner',
    productType: 'banner', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'championship-poster',
    shortDescription: 'Mark a tournament title with your team, bracket, and result.',
    fullDescription:
      'Celebrate the run to the title. A personalized tournament banner featuring your team, the tournament name, and your winning result, in your colors. Preview it free.',
    features: ['Tournament name & result', 'Team roster', 'Your team colors', 'Printed keepsake or digital file'],
    occasionTags: ['championship', 'tournament', 'team'], sportTags: SPORTS,
    seoTitle: 'Tournament Champion Banner', seoDescription: 'Personalized tournament champion banner with your team and result. Free design preview before you order.',
    posterLabel: 'TOURNEY CHAMPS', posterSub: 'Champions',
  },
  {
    slug: 'mvp-poster', name: 'MVP Poster', collectionSlug: 'championship', category: 'Poster',
    productType: 'poster', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'player-spotlight-poster',
    shortDescription: 'A standout-player MVP poster with an action photo and name.',
    fullDescription:
      'Honor the difference-maker. An MVP poster featuring an action photo, name, and your team colors — perfect for the season’s standout. See your free preview first.',
    features: ['MVP action photo & name', 'Award headline', 'Your team colors', 'Digital option for socials'],
    occasionTags: ['championship', 'player', 'award'], sportTags: SPORTS,
    seoTitle: 'MVP Poster', seoDescription: 'Personalized MVP poster with an action photo and your team colors. Start a free design preview — no payment required.',
    posterLabel: 'MVP', posterSub: 'Most Valuable',
  },
  {
    slug: 'team-celebration-banner', name: 'Team Celebration Banner', collectionSlug: 'championship', category: 'Banner',
    productType: 'banner', deliveryType: 'both', startingPriceCents: 7999, proofProductKey: 'championship-poster',
    shortDescription: 'A celebration banner for the whole team’s big moment.',
    fullDescription:
      'Keep the celebration going. A team celebration banner featuring your roster and a headline moment, personalized with your colors. Preview your design free first.',
    features: ['Team roster & celebration headline', 'Hero photo', 'Your team colors', 'Printed keepsake or digital file'],
    occasionTags: ['championship', 'celebration', 'team'], sportTags: SPORTS,
    seoTitle: 'Team Celebration Banner', seoDescription: 'Personalized team celebration banner for your big moment. Free design preview — pay only when ready.',
    posterLabel: 'CELEBRATE', posterSub: 'Team Moment',
  },
  {
    slug: 'championship-social-pack', name: 'Championship Social Pack', collectionSlug: 'championship', category: 'Social Pack',
    productType: 'social-pack', deliveryType: 'digital', startingPriceCents: 999, proofProductKey: 'football-social-graphics',
    shortDescription: 'A set of share-ready championship graphics for social.',
    fullDescription:
      'Announce the title everywhere. A pack of personalized championship graphics sized for social, featuring your team, colors, and result. Free preview before you download.',
    features: ['Multiple social-ready graphics', 'Team name & result', 'Your team colors', 'Instant digital download'],
    occasionTags: ['championship', 'social', 'announcement'], sportTags: SPORTS,
    seoTitle: 'Championship Social Pack', seoDescription: 'Personalized championship social media graphics pack. Free design preview — instant digital download.',
    posterLabel: 'CHAMPS', posterSub: 'Social Pack',
  },

  // SOCIAL GRAPHICS COLLECTION
  // ── Photo Collages ─────────────────────────────────────────────────────────
  {
    slug: 'world-memories-photo-collage', name: 'World Memories Photo Collage',
    collectionSlug: 'photo-collages', category: 'Photo Collage',
    productType: 'collage', deliveryType: 'both', startingPriceCents: 7999,
    proofProductKey: 'world-memories-collage',
    ctaLabel: 'Create My Photo Collage',
    shortDescription:
      'Turn your favorite memories into one unforgettable personalized photo artwork.',
    fullDescription:
      'A premium collage built from your own photographs — one hero image surrounded by the moments that belong with it. Add 20 to 50 photos from a trip, a family year, an anniversary, or a lifetime, write your own headline, and see the finished artwork before you pay.',
    features: [
      'Add roughly 20–50 of your own photos',
      'Choose one hero photo to anchor the design',
      'Write your own headline and subtitle',
      'Print-ready 300 DPI with safe margins',
    ],
    occasionTags: ['travel', 'family', 'vacation', 'anniversary', 'friendship', 'milestone', 'nature', 'adventure', 'memorial'],
    seoTitle: 'World Memories Photo Collage — Personalized Memory Artwork',
    seoDescription:
      'Turn travel, family, and vacation photos into one premium personalized photo collage. Digital $9.99 or printed 24×36". Free design preview before you pay.',
    posterLabel: 'MEMORIES', posterSub: 'World Collage',
    badge: 'New', featured: true,
  },
  {
    slug: 'game-day-graphic', name: 'Game Day Graphic', collectionSlug: 'social-graphics', category: 'Social Graphic',
    productType: 'social-graphic', deliveryType: 'digital', startingPriceCents: 999, proofProductKey: 'football-social-graphics',
    featured: true,
    shortDescription: 'A share-ready game day graphic to announce the matchup.',
    fullDescription:
      'Hype the matchup online. A personalized game day graphic with your team, opponent, date, and colors — sized for social. Free preview before you download.',
    features: ['Matchup, date & time', 'Your team colors', 'Sized for social', 'Instant digital download'],
    occasionTags: ['game-day', 'social', 'announcement'], sportTags: SPORTS,
    seoTitle: 'Game Day Graphic', seoDescription: 'Personalized game day social media graphic for your matchup. Free design preview — instant digital download.',
    posterLabel: 'GAME DAY', posterSub: 'Matchup',
  },
  {
    slug: 'final-score-graphic', name: 'Final Score Graphic', collectionSlug: 'social-graphics', category: 'Social Graphic',
    productType: 'social-graphic', deliveryType: 'digital', startingPriceCents: 999, proofProductKey: 'football-social-graphics',
    shortDescription: 'A post-game graphic to share the final score.',
    fullDescription:
      'Post the result the second it’s final. A personalized final score graphic with both teams, the score, and your colors — sized for social. Free preview first.',
    features: ['Both teams & final score', 'Your team colors', 'Sized for social', 'Instant digital download'],
    occasionTags: ['game-day', 'social', 'result'], sportTags: SPORTS,
    seoTitle: 'Final Score Graphic', seoDescription: 'Personalized final score social media graphic. Free design preview — instant digital download.',
    posterLabel: 'FINAL', posterSub: 'Score',
  },
  {
    slug: 'player-of-the-game', name: 'Player of the Game Graphic', collectionSlug: 'social-graphics', category: 'Social Graphic',
    productType: 'social-graphic', deliveryType: 'digital', startingPriceCents: 999, proofProductKey: 'player-spotlight-poster',
    shortDescription: 'A player-of-the-game graphic to spotlight a standout.',
    fullDescription:
      'Give the standout their moment. A personalized player of the game graphic with an action photo, name, and your colors — sized for social. Free preview before download.',
    features: ['Player photo & name', 'Award headline', 'Your team colors', 'Instant digital download'],
    occasionTags: ['player', 'social', 'award'], sportTags: SPORTS,
    seoTitle: 'Player of the Game Graphic', seoDescription: 'Personalized player of the game social graphic. Free design preview — instant digital download.',
    posterLabel: 'POTG', posterSub: 'Player of the Game',
  },
  {
    slug: 'schedule-graphic', name: 'Schedule Graphic', collectionSlug: 'social-graphics', category: 'Social Graphic',
    productType: 'social-graphic', deliveryType: 'digital', startingPriceCents: 999, proofProductKey: 'football-social-graphics',
    shortDescription: 'A season schedule graphic to share all your matchups.',
    fullDescription:
      'Put the whole season in one post. A personalized schedule graphic listing your matchups and dates in your team colors — sized for social. Free preview first.',
    features: ['Full season schedule', 'Your team colors', 'Sized for social', 'Instant digital download'],
    occasionTags: ['season', 'social', 'schedule'], sportTags: SPORTS,
    seoTitle: 'Team Schedule Graphic', seoDescription: 'Personalized season schedule social media graphic. Free design preview — instant digital download.',
    posterLabel: 'SCHEDULE', posterSub: 'Season',
  },
  {
    slug: 'thank-you-coach', name: 'Thank You Coach Graphic', collectionSlug: 'social-graphics', category: 'Social Graphic',
    productType: 'social-graphic', deliveryType: 'digital', startingPriceCents: 999, proofProductKey: 'coach-recognition-banner',
    shortDescription: 'A thank-you graphic to celebrate your coach on social.',
    fullDescription:
      'Say thanks where the whole team can see it. A personalized thank-you coach graphic with a photo and message in your colors — sized for social. Free preview before download.',
    features: ['Coach photo & message', 'Your team colors', 'Sized for social', 'Instant digital download'],
    occasionTags: ['appreciation', 'social', 'end-of-season'], sportTags: SPORTS,
    seoTitle: 'Thank You Coach Graphic', seoDescription: 'Personalized thank you coach social media graphic. Free design preview — instant digital download.',
    posterLabel: 'THANK YOU', posterSub: 'Coach',
  },
  {
    slug: 'team-announcement', name: 'Team Announcement Graphic', collectionSlug: 'social-graphics', category: 'Social Graphic',
    productType: 'social-graphic', deliveryType: 'digital', startingPriceCents: 999, proofProductKey: 'football-social-graphics',
    shortDescription: 'An announcement graphic for signings, tryouts, and news.',
    fullDescription:
      'Make it official online. A personalized announcement graphic for signings, tryouts, or team news — with your photo and colors, sized for social. Free preview first.',
    features: ['Announcement headline & details', 'Your photo & colors', 'Sized for social', 'Instant digital download'],
    occasionTags: ['announcement', 'social', 'team'], sportTags: SPORTS,
    seoTitle: 'Team Announcement Graphic', seoDescription: 'Personalized team announcement social media graphic. Free design preview — instant digital download.',
    posterLabel: 'ANNOUNCEMENT', posterSub: 'Team News',
  },
];

const PRODUCTS: Product[] = SEEDS.map(build);

/**
 * Curated cross-sell overrides for merchandising (can span collections). Every slug is a
 * real product, so relatedProductSlugs always resolves. Products without an override fall
 * back to same-collection siblings.
 */
const RELATED_OVERRIDES: Record<string, string[]> = {
  'team-banner': ['team-poster', 'coach-appreciation-banner', 'schedule-graphic', 'player-spotlight-banner'],
  'senior-night-banner': ['player-spotlight-banner', 'team-banner', 'team-photo-collage', 'game-day-graphic'],
  'graduation-banner': ['graduation-poster', 'graduation-yard-sign', 'graduation-memory-collage', 'graduation-social-graphic'],
  'championship-banner': ['championship-poster', 'mvp-poster', 'team-celebration-banner', 'championship-social-pack'],
  'game-day-graphic': ['final-score-graphic', 'schedule-graphic', 'player-of-the-game', 'team-announcement'],
  // Alone in its collection, so it needs an explicit cross-sell list: the other collage and
  // poster products are its closest analogues, and all four are sellable today.
  'world-memories-photo-collage': ['team-photo-collage', 'graduation-memory-collage', 'graduation-poster', 'team-poster'],
};

const validSlugs = new Set(PRODUCTS.map((p) => p.slug));

// Fill relatedProductSlugs from curated overrides (validated), else same-collection siblings.
for (const p of PRODUCTS) {
  const override = RELATED_OVERRIDES[p.slug]?.filter((s) => validSlugs.has(s) && s !== p.slug);
  p.relatedProductSlugs = (
    override && override.length > 0
      ? override
      : PRODUCTS.filter((o) => o.collectionSlug === p.collectionSlug && o.slug !== p.slug).map((o) => o.slug)
  ).slice(0, 4);
}

// ── Helper API ───────────────────────────────────────────────────────────────
export function getAllProducts(): Product[] {
  return PRODUCTS;
}

export function getFeaturedProducts(): Product[] {
  // Explicit homepage/shop feature order (matches the sprint brief).
  const order = [
    'team-banner',
    'senior-night-banner',
    'graduation-banner',
    'graduation-poster',
    'championship-banner',
    'game-day-graphic',
  ];
  return order.map((slug) => getProductBySlug(slug)).filter((p): p is Product => Boolean(p));
}

export function getProductsByCollection(collectionSlug: CollectionSlug): Product[] {
  return PRODUCTS.filter((p) => p.collectionSlug === collectionSlug);
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getRelatedProducts(slug: string, limit = 3): Product[] {
  const product = getProductBySlug(slug);
  if (!product) return [];
  const explicit = product.relatedProductSlugs
    .map((s) => getProductBySlug(s))
    .filter((p): p is Product => Boolean(p));
  if (explicit.length >= limit) return explicit.slice(0, limit);
  // Fallback: top up with other products from the same collection.
  const extra = getProductsByCollection(product.collectionSlug).filter(
    (p) => p.slug !== slug && !explicit.some((e) => e.slug === p.slug),
  );
  return [...explicit, ...extra].slice(0, limit);
}

export function getAllCollections(): Collection[] {
  return COLLECTIONS;
}

export function getCollectionBySlug(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

/** Distinct occasion tags across the catalog (for the shop "browse by occasion"). */
export function getAllOccasions(): string[] {
  return [...new Set(PRODUCTS.flatMap((p) => p.occasionTags))].sort();
}

/** Distinct sport tags across the catalog (for the shop "browse by sport"). */
export function getAllSports(): string[] {
  return [...new Set(PRODUCTS.flatMap((p) => p.sportTags))].sort();
}
