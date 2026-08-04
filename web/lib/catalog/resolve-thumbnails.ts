/**
 * SERVER-ONLY. Computes card thumbnail overrides for products whose APPROVED asset is present
 * on disk. Products without an approved file are omitted, so the client grid falls back to the
 * catalog placeholder (product.image). Kept out of any client-imported module because
 * resolveProductImage reads the filesystem.
 */

import { resolveProductImage } from './product-image';
import type { ImageOverrides } from '@/components/storefront/product-grid';
import type { Product } from './types';

export function thumbnailOverrides(products: Product[]): ImageOverrides {
  const out: ImageOverrides = {};
  for (const p of products) {
    const img = resolveProductImage(p.slug, 'thumbnail');
    if (!img.isPlaceholder) out[p.slug] = { src: img.src, alt: img.alt };
  }
  return out;
}
