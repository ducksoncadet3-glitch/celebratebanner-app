import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProductOption } from '@/lib/proof/types';

export interface ProductSelectorProps {
  products: ProductOption[];
  value: string | null;
  onChange: (id: string) => void;
  error?: string;
}

/**
 * Single-select product picker rendered as an accessible native radiogroup: each option
 * is a styled label wrapping a visually-hidden radio, so keyboard arrow-key navigation and
 * screen-reader semantics come for free.
 */
function ProductSelectorImpl({ products, value, onChange, error }: ProductSelectorProps) {
  const errorId = error ? 'product-selector-error' : undefined;
  return (
    <fieldset aria-describedby={errorId} aria-invalid={error ? true : undefined}>
      <legend className="sr-only">Choose a product</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => {
          const selected = value === p.id;
          return (
            <label
              key={p.id}
              className={cn(
                'group relative flex cursor-pointer flex-col rounded-xl border bg-white p-4 transition',
                'focus-within:ring-2 focus-within:ring-gold focus-within:ring-offset-1',
                selected
                  ? 'border-gold ring-1 ring-gold shadow-gold'
                  : 'border-obsidian/12 hover:border-obsidian/30',
              )}
            >
              <input
                type="radio"
                name="proof-product"
                value={p.id}
                checked={selected}
                onChange={() => onChange(p.id)}
                className="sr-only"
              />
              <div className="flex items-start justify-between gap-2">
                <span className="font-sans text-base font-semibold text-obsidian">{p.title}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs',
                    selected ? 'border-gold bg-gold text-obsidian' : 'border-obsidian/25 text-transparent',
                  )}
                >
                  ✓
                </span>
              </div>
              <span className="mt-1.5 text-sm leading-relaxed text-obsidian/60">{p.description}</span>
              {p.badge && (
                <span className="mt-3">
                  <Badge variant="featured">{p.badge}</Badge>
                </span>
              )}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-3 text-sm font-medium text-rose">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export const ProductSelector = memo(ProductSelectorImpl);
