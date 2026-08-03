import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Semantic status badge. Colors map onto the CelebrateBanner brand palette
 * (obsidian / gold / sage / sky) rather than a generic red-green-blue set, so badges
 * sit naturally beside the rest of the UI.
 */
type Variant = 'success' | 'warning' | 'info' | 'featured';

const variants: Record<Variant, string> = {
  success: 'bg-sage/12 text-sage ring-1 ring-inset ring-sage/25',
  warning: 'bg-gold/12 text-gold-dark ring-1 ring-inset ring-gold/30',
  info: 'bg-sky/12 text-sky ring-1 ring-inset ring-sky/25',
  featured: 'bg-gradient-to-br from-gold to-gold-light text-obsidian shadow-gold',
};

export function Badge({
  variant = 'info',
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
