import { formatUSD } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export interface PriceDisplayProps {
  cents: number;
  /** Prefix the amount with "From" (starting price). */
  from?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl sm:text-4xl' } as const;

/** Consistent USD price rendering. Amount comes from integer cents (catalog source of truth). */
export function PriceDisplay({ cents, from = true, size = 'md', className }: PriceDisplayProps) {
  return (
    <p className={cn('font-display font-semibold text-obsidian', sizes[size], className)}>
      {from && <span className="mr-1 align-middle text-xs font-sans font-medium uppercase tracking-wide text-obsidian/50">From</span>}
      {formatUSD(cents)}
    </p>
  );
}
