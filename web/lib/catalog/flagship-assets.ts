/**
 * Flagship product asset MANIFEST.
 *
 * Defines where the seven approved flagship mockups will live and how they should be sized,
 * WITHOUT changing the catalog. The catalog (lib/catalog/products.ts) remains the single
 * source of truth for product data; this manifest is an asset overlay keyed by product slug.
 *
 * Files are NOT present yet — the storefront stays on the generated SAMPLE DESIGN
 * placeholders until real WebP files are dropped into web/public/storefront/<slug>/.
 * See web/docs/FLAGSHIP_PRODUCT_ASSETS.md.
 */

export type AssetAspect = 'landscape' | 'portrait' | 'square';

export interface Dimensions {
  width: number;
  height: number;
}

export interface FlagshipAsset {
  slug: string;
  /** Public URL of the expected hero image (served from web/public). */
  heroPath: string;
  /** Public URL of the expected thumbnail image. */
  thumbnailPath: string;
  aspect: AssetAspect;
  heroDimensions: Dimensions;
  thumbnailDimensions: Dimensions;
  /** Required alt text describing the finished product (used when the real asset is present). */
  alt: string;
  /** What happens when the file is absent: fall back to the catalog placeholder. */
  fallback: 'placeholder';
}

/** Recommended dimensions per aspect (from the launch-readiness spec). */
export const ASPECT_DIMENSIONS: Record<AssetAspect, { hero: Dimensions; thumbnail: Dimensions }> = {
  landscape: { hero: { width: 1600, height: 900 }, thumbnail: { width: 800, height: 450 } },
  portrait: { hero: { width: 1200, height: 1500 }, thumbnail: { width: 640, height: 800 } },
  square: { hero: { width: 1200, height: 1200 }, thumbnail: { width: 800, height: 800 } },
};

/** Preferred export format for all approved assets. */
export const PREFERRED_FORMAT = 'webp' as const;

/** Base public directory for approved flagship assets. */
export const ASSET_BASE = '/storefront';

interface FlagshipSeed {
  slug: string;
  aspect: AssetAspect;
  alt: string;
}

// Aspect is derived from each product's productType in the catalog:
//   banner → landscape · poster → portrait · social-graphic → square
const SEEDS: FlagshipSeed[] = [
  { slug: 'team-banner', aspect: 'landscape', alt: 'Personalized team banner featuring the team roster, a hero photo, and team colors.' },
  { slug: 'senior-night-banner', aspect: 'landscape', alt: "Personalized senior night banner featuring the athlete's photo, number, and name." },
  { slug: 'graduation-banner', aspect: 'landscape', alt: "Personalized graduation banner featuring the graduate's photo, name, and year." },
  { slug: 'graduation-poster', aspect: 'portrait', alt: "Personalized graduation poster featuring the graduate's photo, name, and year." },
  { slug: 'championship-banner', aspect: 'landscape', alt: 'Personalized championship banner featuring the team name, record, and roster.' },
  { slug: 'coach-appreciation-banner', aspect: 'landscape', alt: "Personalized coach appreciation banner featuring the coach's photo and a tribute message." },
  { slug: 'game-day-graphic', aspect: 'square', alt: 'Personalized game day social graphic featuring the matchup, date, and team colors.' },
];

function build(seed: FlagshipSeed): FlagshipAsset {
  const dims = ASPECT_DIMENSIONS[seed.aspect];
  return {
    slug: seed.slug,
    heroPath: `${ASSET_BASE}/${seed.slug}/hero.${PREFERRED_FORMAT}`,
    thumbnailPath: `${ASSET_BASE}/${seed.slug}/thumbnail.${PREFERRED_FORMAT}`,
    aspect: seed.aspect,
    heroDimensions: dims.hero,
    thumbnailDimensions: dims.thumbnail,
    alt: seed.alt,
    fallback: 'placeholder',
  };
}

export const FLAGSHIP_ASSETS: FlagshipAsset[] = SEEDS.map(build);

export const FLAGSHIP_SLUGS: string[] = FLAGSHIP_ASSETS.map((a) => a.slug);

export function getFlagshipAsset(slug: string): FlagshipAsset | undefined {
  return FLAGSHIP_ASSETS.find((a) => a.slug === slug);
}
