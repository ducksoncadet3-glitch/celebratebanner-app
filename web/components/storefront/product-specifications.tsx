import type { ProductSpec } from '@/lib/catalog/types';

export interface ProductSpecificationsProps {
  specifications: ProductSpec[];
  availableSizes: string[];
  /** Ready-made products have no customization step, so the standing note must not appear. */
  productMode?: 'personalized' | 'ready-made';
}

/**
 * Specifications table. Confirmed facts only; a standing note tells customers exact options
 * appear during customization (so we never over-promise unconfirmed specs).
 */
export function ProductSpecifications({ specifications, availableSizes, productMode = 'personalized' }: ProductSpecificationsProps) {
  return (
    <div>
      <dl className="divide-y divide-obsidian/8 overflow-hidden rounded-xl border border-obsidian/[0.08]">
        {availableSizes.length > 0 && (
          <div className="flex justify-between gap-4 px-4 py-3 text-sm">
            <dt className="font-medium text-obsidian/55">Sizes</dt>
            <dd className="text-right text-obsidian">{availableSizes.join(' · ')}</dd>
          </div>
        )}
        {specifications.map((s) => (
          <div key={s.label} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <dt className="font-medium text-obsidian/55">{s.label}</dt>
            <dd className="text-right text-obsidian">{s.value}</dd>
          </div>
        ))}
      </dl>
      {productMode === 'personalized' ? (
        <p className="mt-3 text-xs text-obsidian/55">Available options are shown during customization.</p>
      ) : null}
    </div>
  );
}
