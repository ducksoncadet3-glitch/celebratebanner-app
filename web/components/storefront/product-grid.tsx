import { ProductCard } from '@/components/product/product-card';
import { cn } from '@/lib/utils';
import { isComingSoon, COMING_SOON_LABEL } from '@/lib/catalog/availability';
import type { Product } from '@/lib/catalog/types';

/**
 * Per-slug resolved image (src + alt) computed on the SERVER and passed down as plain data.
 * ProductGrid stays fs-free so it remains safe inside the client ShopFilter bundle.
 */
export type ImageOverrides = Record<string, { src: string; alt: string }>;

export interface ProductGridProps {
  products: Product[];
  /** Tailwind grid column classes; defaults to a responsive 1→2→3 grid. */
  columnsClassName?: string;
  className?: string;
  /** Approved-asset overrides keyed by slug. Absent slug → the catalog placeholder is used. */
  imageOverrides?: ImageOverrides;
}

/**
 * Grid of catalog products. Reuses the existing ProductCard (Sprint 002). Each card links to
 * the product detail page — the proof CTA lives on the detail page, so browsing funnels
 * cleanly: card → product → free proof.
 */
export function ProductGrid({ products, columnsClassName, className, imageOverrides }: ProductGridProps) {
  return (
    <div className={cn('grid gap-6', columnsClassName ?? 'sm:grid-cols-2 lg:grid-cols-3', className)}>
      {products.map((p) => {
        const override = imageOverrides?.[p.slug];
        // Coming Soon: the card still links to the (live) detail page for discovery, but it
        // must never show a price or a purchase/design CTA — the renderer cannot produce it.
        const comingSoon = isComingSoon(p);
        return (
          <ProductCard
            key={p.slug}
            image={override?.src ?? p.image}
            imageAlt={override?.alt ?? `${p.name} — sample design (placeholder)`}
            title={p.name}
            description={p.shortDescription}
            href={`/products/${p.slug}`}
            price={comingSoon ? COMING_SOON_LABEL : p.priceLabel}
            badge={
              comingSoon
                ? { label: COMING_SOON_LABEL, variant: 'info' }
                : p.badge
                  ? { label: p.badge, variant: 'featured' }
                  : undefined
            }
            buttonText={comingSoon ? 'View details' : 'View product'}
            className={comingSoon ? 'opacity-75' : undefined}
          />
        );
      })}
    </div>
  );
}
