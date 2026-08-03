import { ProductGrid } from './product-grid';
import { getFrequentlyBoughtTogether } from '@/lib/catalog/merchandising';
import type { Product } from '@/lib/catalog/types';

/** Complementary products from the same collection. Hidden if none resolve. */
export function FrequentlyBoughtTogether({ product }: { product: Product }) {
  const items = getFrequentlyBoughtTogether(product, 3);
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-obsidian sm:text-3xl">Frequently bought together</h2>
      <p className="mt-1 text-sm text-obsidian/60">Popular pairings for {product.name.toLowerCase()}.</p>
      <div className="mt-6">
        <ProductGrid products={items} />
      </div>
    </div>
  );
}
