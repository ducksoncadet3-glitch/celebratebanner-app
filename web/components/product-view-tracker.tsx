'use client';

import { useEffect } from 'react';
import { trackProductView } from '@/lib/attribution';

/**
 * Fires one product_view for this product and captures campaign attribution from the URL.
 * Renders nothing. Client-only because it reads window.location and localStorage.
 */
export function ProductViewTracker({
  productSlug,
  productMode,
}: {
  productSlug: string;
  productMode?: string;
}) {
  useEffect(() => {
    trackProductView(productSlug, productMode);
  }, [productSlug, productMode]);
  return null;
}
