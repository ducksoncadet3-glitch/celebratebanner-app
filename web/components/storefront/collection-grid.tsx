import Link from 'next/link';
import { getProductsByCollection } from '@/lib/catalog/products';
import { cn } from '@/lib/utils';
import type { Collection } from '@/lib/catalog/types';

/** A single collection tile linking to /shop/<slug>. */
export function CollectionCard({ collection }: { collection: Collection }) {
  const count = getProductsByCollection(collection.slug).length;
  return (
    <Link
      href={`/shop/${collection.slug}`}
      className={cn(
        'group flex flex-col justify-between overflow-hidden rounded-xl border border-obsidian/[0.08] bg-white p-6',
        'shadow-[0_2px_12px_-6px_rgba(12,14,20,0.14)] transition duration-200 hover:-translate-y-1 hover:shadow-lift',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2',
      )}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">{collection.tagline}</p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-obsidian">{collection.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-obsidian/60">{collection.description}</p>
      </div>
      <p className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold-dark">
        {count} products
        <span aria-hidden="true" className="transition group-hover:translate-x-0.5">→</span>
      </p>
    </Link>
  );
}

export function CollectionGrid({ collections, className }: { collections: Collection[]; className?: string }) {
  return (
    <div className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {collections.map((c) => (
        <CollectionCard key={c.slug} collection={c} />
      ))}
    </div>
  );
}
