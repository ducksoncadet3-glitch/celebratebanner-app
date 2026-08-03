'use client';

import { useMemo, useState } from 'react';
import { ProductGrid } from './product-grid';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/catalog/types';

export interface ShopFilterProps {
  products: Product[];
  occasions: string[];
  sports: string[];
}

function humanize(tag: string): string {
  return tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Lightweight, accessible client-side catalog filter: a text search plus occasion and
 * sport chips. Derived entirely from catalog data — no search infrastructure. Filtering is
 * instant and the result set is announced for assistive tech.
 */
export function ShopFilter({ products, occasions, sports }: ShopFilterProps) {
  const [query, setQuery] = useState('');
  const [occasion, setOccasion] = useState<string | null>(null);
  const [sport, setSport] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (occasion && !p.occasionTags.includes(occasion)) return false;
      if (sport && !p.sportTags.includes(sport)) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.shortDescription.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, occasion, sport]);

  return (
    <div>
      <div className="grid gap-6">
        <div>
          <label htmlFor="shop-search" className="sr-only">Search products</label>
          <input
            id="shop-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full max-w-md rounded-lg border border-obsidian/15 bg-white px-4 py-2.5 text-obsidian placeholder:text-obsidian/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1"
          />
        </div>

        <Chips label="Browse by occasion" tags={occasions} active={occasion} onToggle={setOccasion} humanize={humanize} />
        <Chips label="Browse by sport" tags={sports} active={sport} onToggle={setSport} humanize={humanize} />
      </div>

      <div className="mt-8">
        <p className="mb-4 text-sm text-obsidian/55" aria-live="polite">
          Showing {filtered.length} of {products.length} products
        </p>
        {filtered.length > 0 ? (
          <ProductGrid products={filtered} />
        ) : (
          <p className="rounded-xl border border-obsidian/10 bg-white p-8 text-center text-obsidian/60">
            No products match. Try clearing a filter.
          </p>
        )}
      </div>
    </div>
  );
}

function Chips({
  label,
  tags,
  active,
  onToggle,
  humanize,
}: {
  label: string;
  tags: string[];
  active: string | null;
  onToggle: (v: string | null) => void;
  humanize: (t: string) => string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {tags.map((t) => {
          const on = active === t;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(on ? null : t)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1',
                on ? 'bg-obsidian text-gold-pale' : 'bg-obsidian/6 text-obsidian/70 hover:bg-obsidian/10',
              )}
            >
              {humanize(t)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
