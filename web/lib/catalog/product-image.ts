/**
 * Flagship product image resolver (SERVER-ONLY).
 *
 * Resolution order (never produces a broken image):
 *   1. If the product is a flagship AND its approved WebP file exists on disk under
 *      web/public → use the approved asset.
 *   2. Otherwise → fall back to the catalog's generated SAMPLE DESIGN placeholder.
 *
 * The catalog stays the single source of truth: the placeholder + product name always come
 * from lib/catalog/products.ts; this helper only overlays the approved-asset path when a real
 * file is present. Today no files exist, so every product resolves to its placeholder and the
 * visible storefront is unchanged.
 *
 * Not wired into any page yet — see FLAGSHIP_PRODUCT_ASSETS.md for the activation step.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getProductBySlug } from './products';
import { ASPECT_DIMENSIONS, getFlagshipAsset, type AssetAspect } from './flagship-assets';

export type ImageVariant = 'hero' | 'thumbnail';

export interface ResolvedImage {
  /** Image src — an approved public path OR the catalog placeholder data URI. Never empty. */
  src: string;
  alt: string;
  width: number;
  height: number;
  aspect: AssetAspect;
  /** True when falling back to the generated placeholder (no approved file present). */
  isPlaceholder: boolean;
}

export interface ResolveOptions {
  /**
   * Existence predicate for the approved public path (e.g. "/storefront/team-banner/hero.webp").
   * Defaults to a real filesystem check against web/public. Injectable for tests.
   */
  exists?: (publicPath: string) => boolean;
}

/** Default: does the file exist under web/public? */
function fileExists(publicPath: string): boolean {
  try {
    return existsSync(join(process.cwd(), 'public', publicPath.replace(/^\//, '')));
  } catch {
    return false;
  }
}

/** Placeholder aspect fallback for non-flagship products (kept generic). */
function placeholderAspect(): AssetAspect {
  return 'landscape';
}

/**
 * Resolve the image for a product + variant. Always returns a usable src.
 * Unknown slugs return an empty-safe placeholder result rather than throwing.
 */
export function resolveProductImage(
  slug: string,
  variant: ImageVariant = 'hero',
  opts: ResolveOptions = {},
): ResolvedImage {
  const exists = opts.exists ?? fileExists;
  const product = getProductBySlug(slug);
  const flagship = getFlagshipAsset(slug);

  const aspect: AssetAspect = flagship?.aspect ?? placeholderAspect();
  const dims = ASPECT_DIMENSIONS[aspect][variant];

  // Prefer the approved asset only when it is a flagship AND the file actually exists.
  if (flagship) {
    const approvedPath = variant === 'hero' ? flagship.heroPath : flagship.thumbnailPath;
    if (exists(approvedPath)) {
      return {
        src: approvedPath,
        alt: flagship.alt,
        width: dims.width,
        height: dims.height,
        aspect,
        isPlaceholder: false,
      };
    }
  }

  // Fallback: the catalog placeholder (data-URI SVG). Guaranteed non-empty for real products.
  const placeholderSrc = product?.image ?? '';
  return {
    src: placeholderSrc,
    alt: product ? `${product.name} — sample design placeholder` : 'Sample design placeholder',
    width: dims.width,
    height: dims.height,
    aspect,
    isPlaceholder: true,
  };
}
