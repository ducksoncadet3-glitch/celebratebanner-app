import { Container } from '@/components/ui/container';
import { formatUSD } from '@/lib/pricing';
import { getAllProducts } from '@/lib/catalog/products';

/**
 * Compact, above-the-fold reassurance strip. Front-loads the factual trust signals and an
 * honest price anchor so visitors see them without scrolling to the full trust section.
 *
 * No fabricated content: the four points are factual (free proof, no payment to preview,
 * Stripe checkout, printed/digital), and the price anchor is DERIVED from the catalog
 * (lowest overall price and lowest banner price), so it can never drift from real prices.
 */
const POINTS = [
  'Free design proof',
  'No payment to preview',
  'Secure Stripe checkout',
  'Printed & digital options',
];

export function TrustBar() {
  const products = getAllProducts();
  const prices = products.map((p) => p.startingPriceCents);
  const bannerPrices = products.filter((p) => p.productType === 'banner').map((p) => p.startingPriceCents);
  const lowest = prices.length ? Math.min(...prices) : 0;
  const lowestBanner = bannerPrices.length ? Math.min(...bannerPrices) : 0;

  return (
    <section aria-label="Why you can order with confidence" className="border-y border-gold/15 bg-white">
      <Container>
        <ul
          role="list"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-4 text-sm text-obsidian/70"
        >
          {POINTS.map((p) => (
            <li key={p} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage/15 text-[10px] text-sage"
              >
                ✓
              </span>
              {p}
            </li>
          ))}
          {lowest > 0 && lowestBanner > 0 && (
            <li className="font-medium text-obsidian">
              Digital {formatUSD(lowest)} · Printed from {formatUSD(lowestBanner)}
            </li>
          )}
        </ul>
      </Container>
    </section>
  );
}
