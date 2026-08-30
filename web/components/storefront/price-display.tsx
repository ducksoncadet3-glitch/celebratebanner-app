import { formatUSD } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export interface PriceDisplayProps {
  cents?: number;
  /** Pre-formatted, delivery-aware price line (e.g. "Print from $79.99 · Digital $9.99").
   *  When provided, it is rendered verbatim and `cents`/`from` are ignored. */
  label?: string;
  /** Prefix the amount with "From" (starting price). Ignored when `label` is set. */
  from?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl sm:text-4xl' } as const;

/** Consistent USD price rendering. Pass a delivery-aware `label`, or integer `cents`. */
export function PriceDisplay({ cents, label, from = true, size = 'md', className }: PriceDisplayProps) {
  return (
    <p className={cn('font-display font-semibold text-obsidian', sizes[size], className)}>
      {label !== undefined ? (
        label
      ) : (
        <>
          {from && <span className="mr-1 align-middle text-xs font-sans font-medium uppercase tracking-wide text-obsidian/50">From</span>}
          {formatUSD(cents ?? 0)}
        </>
      )}
    </p>
  );
}
