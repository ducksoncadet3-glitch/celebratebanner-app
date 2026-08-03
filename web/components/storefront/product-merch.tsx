import { getCoachTip, getRecommendedFor, getWhyChoose } from '@/lib/catalog/merchandising';
import type { Product } from '@/lib/catalog/types';

/** "Why customers choose this product" — factual, catalog-derived bullets. */
export function WhyChoose({ product }: { product: Product }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-obsidian sm:text-3xl">Why customers choose this</h2>
      <ul role="list" className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {getWhyChoose(product).map((line, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-obsidian/75">
            <span aria-hidden="true" className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/15 text-xs text-sage">✓</span>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Recommended / Perfect for" audience chips. */
export function RecommendedFor({ product }: { product: Product }) {
  const audiences = getRecommendedFor(product);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-obsidian/55">Perfect for</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {audiences.map((a) => (
          <li key={a} className="rounded-full bg-obsidian/6 px-3 py-1 text-sm font-medium text-obsidian/75">
            {a}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A short, helpful coach tip (guidance, not a claim). */
export function CoachTip({ product }: { product: Product }) {
  return (
    <aside className="rounded-xl border border-gold/25 bg-gold/5 p-4" aria-label="Coach tip">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Coach tip</p>
      <p className="mt-1.5 text-sm leading-relaxed text-obsidian/75">{getCoachTip(product)}</p>
    </aside>
  );
}
