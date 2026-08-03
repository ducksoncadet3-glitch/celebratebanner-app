import { ProductGrid } from './product-grid';
import { getRelatedProducts } from '@/lib/catalog/products';

/** Related products (curated cross-sells, may span collections). Hidden if none resolve. */
export function RelatedProducts({ slug, limit = 4 }: { slug: string; limit?: number }) {
  const related = getRelatedProducts(slug, limit);
  if (related.length === 0) return null;
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-obsidian sm:text-3xl">You might also like</h2>
      <div className="mt-6">
        <ProductGrid products={related} columnsClassName="sm:grid-cols-2 lg:grid-cols-4" />
      </div>
    </div>
  );
}
