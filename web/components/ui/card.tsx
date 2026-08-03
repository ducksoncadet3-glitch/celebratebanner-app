import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { ElementType, ReactNode } from 'react';

/**
 * Reusable surface wrapper: rounded-xl, soft shadow, padding, optional hover lift.
 * Presentational and pure, so it is memoized to avoid re-rendering when a parent updates
 * for reasons unrelated to this card's props.
 */
type Padding = 'none' | 'sm' | 'md' | 'lg';

const paddings: Record<Padding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export interface CardProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  padding?: Padding;
  /** Adds a subtle lift + deeper shadow on hover. */
  hover?: boolean;
}

function CardImpl({ children, className, as: Tag = 'div', padding = 'md', hover = false }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-obsidian/[0.08] bg-white shadow-[0_2px_12px_-6px_rgba(12,14,20,0.14)]',
        paddings[padding],
        hover && 'transition duration-200 hover:-translate-y-1 hover:shadow-lift',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export const Card = memo(CardImpl);
