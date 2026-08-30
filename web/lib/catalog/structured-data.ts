import { PRICING } from '@/lib/pricing';
import type { Product } from './types';

/**
 * schema.org offer for a product's JSON-LD. Prices are the amounts checkout actually
 * charges (lib/pricing.ts), so structured data can never advertise an uncharged price:
 *   • both     → AggregateOffer $9.99–$79.99 (digital + print, matching the visible label)
 *   • printed  → Offer $79.99
 *   • digital  → Offer $9.99
 */
export function productOffer(product: Product): Record<string, string> {
  const digital = (PRICING.digital.amountCents / 100).toFixed(2);
  const print = (PRICING.print.amountCents / 100).toFixed(2);
  if (product.deliveryType === 'both') {
    return {
      '@type': 'AggregateOffer',
      lowPrice: digital,
      highPrice: print,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    };
  }
  return {
    '@type': 'Offer',
    price: (product.startingPriceCents / 100).toFixed(2),
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  };
}
