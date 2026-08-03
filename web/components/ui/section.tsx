import { cn } from '@/lib/utils';
import { Container } from './container';
import type { ReactNode } from 'react';

/**
 * Page section with configurable background, vertical spacing, and inner container width.
 * Renders as a semantic <section>. Set `container={false}` to manage the inner width
 * yourself.
 */
type Background = 'none' | 'ivory' | 'ivory-dim' | 'obsidian' | 'gold-tint';
type Spacing = 'sm' | 'md' | 'lg' | 'xl';
type Width = 'default' | 'narrow' | 'wide' | 'full';

const backgrounds: Record<Background, string> = {
  none: '',
  ivory: 'bg-ivory text-obsidian',
  'ivory-dim': 'bg-ivory-dim text-obsidian',
  obsidian: 'bg-obsidian text-ivory',
  'gold-tint': 'bg-gold/5 text-obsidian',
};

const spacings: Record<Spacing, string> = {
  sm: 'py-10 sm:py-14',
  md: 'py-16 sm:py-20',
  lg: 'py-20 sm:py-28',
  xl: 'py-24 sm:py-36',
};

export function Section({
  children,
  className,
  background = 'none',
  spacing = 'lg',
  width = 'default',
  container = true,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: {
  children: ReactNode;
  className?: string;
  background?: Background;
  spacing?: Spacing;
  width?: Width;
  container?: boolean;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={cn(backgrounds[background], spacings[spacing], className)}
    >
      {container ? <Container width={width}>{children}</Container> : children}
    </section>
  );
}
