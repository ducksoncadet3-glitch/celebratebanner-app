import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Responsive max-width wrapper. `width` defaults to `default`, which keeps the existing
 * `container-page` behavior so every current caller is unchanged; the other widths are
 * additive options for the component foundation.
 */
type Width = 'default' | 'narrow' | 'wide' | 'full';

const widths: Record<Width, string> = {
  default: 'container-page',
  narrow: 'mx-auto w-full max-w-3xl px-5 sm:px-8',
  wide: 'mx-auto w-full max-w-7xl px-5 sm:px-8',
  full: 'w-full px-5 sm:px-8',
};

export function Container({
  children,
  className,
  as: Tag = 'div',
  width = 'default',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'footer' | 'main';
  width?: Width;
}) {
  return <Tag className={cn(widths[width], className)}>{children}</Tag>;
}
