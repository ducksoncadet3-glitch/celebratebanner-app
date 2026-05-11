import { Slot } from './slot';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  children: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary:
    'bg-obsidian text-gold-pale shadow-lift hover:bg-obsidian-50 hover:text-gold-pale',
  secondary:
    'border border-gold/40 bg-white text-obsidian hover:border-gold hover:bg-gold/5',
  ghost: 'text-obsidian hover:bg-obsidian/5',
  gold:
    'bg-gradient-to-br from-gold to-gold-light text-obsidian shadow-gold hover:from-gold-light hover:to-gold',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-sm sm:text-base',
  lg: 'px-8 py-3.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  asChild,
  children,
  ...rest
}: Props) {
  const Comp: any = asChild ? Slot : 'button';
  return (
    <Comp className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </Comp>
  );
}
