/**
 * Centralized pricing constants — the single source of truth for the frontend.
 *
 * IMPORTANT: The backend (celebratebanner-api) maintains its own copy of these
 * constants and authoritatively re-prices every checkout. The values here are
 * only used for display + client-side validation. Stripe always charges the
 * amount returned by the backend, never a value from the browser.
 *
 * Amounts are in USD cents.
 */

export type ProductId = 'digital' | 'print' | 'video';
export type RenderType = 'standard' | 'premium';

export interface Product {
  id: ProductId;
  label: string;
  tagline: string;
  description: string;
  amountCents: number;
  /** Human-readable price for marketing surfaces. */
  displayPrice: string;
  /** Optional badge text shown next to the price. */
  badge?: string;
  /** Whether this is the default/featured product on /pricing. */
  featured?: boolean;
  /** Stripe product metadata that gets attached to the Checkout Session. */
  metadata: {
    fulfillment: 'digital' | 'print' | 'video';
    requiresShipping: boolean;
  };
}

export const PRICING: Record<ProductId, Product> = {
  digital: {
    id: 'digital',
    label: 'Digital Banner',
    tagline: 'Instant download',
    description:
      'High-resolution 300 DPI PDF + JPG, ready to print anywhere. Includes bleed and safe margins.',
    amountCents: 999,
    displayPrice: '$9.99',
    badge: 'Most popular',
    featured: true,
    metadata: { fulfillment: 'digital', requiresShipping: false },
  },
  print: {
    id: 'print',
    label: 'Printed Banner',
    tagline: '24×36" delivered',
    description:
      "We professionally print your banner at 24×36\" on premium vinyl with grommets, and ship it to your door in 3–5 business days.",
    amountCents: 7999,
    displayPrice: '$79.99',
    metadata: { fulfillment: 'print', requiresShipping: true },
  },
  video: {
    id: 'video',
    label: 'Video Slideshow',
    tagline: 'Premium upsell',
    description:
      'A cinematic 60-second slideshow of your photos with music and motion — perfect for sharing on social.',
    amountCents: 1900,
    displayPrice: '+$19',
    badge: 'Add-on',
    metadata: { fulfillment: 'video', requiresShipping: false },
  },
};

export const PRODUCT_ORDER: ProductId[] = ['digital', 'print', 'video'];

/**
 * Public availability of the video slideshow add-on.
 *
 * The renderer, encoder (backend-stub/video/encoder.js), worker branch, SKU and delivery
 * path are all implemented and intentionally left intact — but video has never been proven
 * end to end by a real paid order, and the worker swallows a video failure (logs and
 * continues) so a customer could pay for it and silently receive only the banner.
 *
 * Until a controlled video order certifies that path, it is not advertised or sellable.
 * Flip this to true to restore the public upsell; nothing else needs to change.
 */
export const VIDEO_UPSELL_PUBLIC = false;

/** Product ids a customer may actually purchase right now. */
export const PURCHASABLE_PRODUCTS: ProductId[] = PRODUCT_ORDER.filter(
  (id) => id !== 'video' || VIDEO_UPSELL_PUBLIC,
);

/** True when `id` may be bought today. Guards the checkout path, not just the UI. */
export function isPurchasable(id: ProductId): boolean {
  return PURCHASABLE_PRODUCTS.includes(id);
}

export function formatUSD(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function totalCents(productIds: ProductId[]): number {
  return productIds.reduce((sum, id) => sum + PRICING[id].amountCents, 0);
}
