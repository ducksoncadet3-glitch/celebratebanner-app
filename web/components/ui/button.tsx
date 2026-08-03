import { Slot } from './slot';
import { Spinner } from './spinner';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * `outline` and `ghost` are the requested foundation variants; `gold` is retained for
 * backward compatibility with existing callers (nav, pricing, etc.). Adding variants
 * here is purely additive — no existing usage changes.
 */
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Render as the child element (e.g. an <a>/<Link>) instead of a <button>. */
  asChild?: boolean;
  /** Shows a spinner and disables interaction. */
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary: 'bg-obsidian text-gold-pale shadow-lift hover:bg-obsidian-50 hover:text-gold-pale',
  secondary: 'border border-gold/40 bg-white text-obsidian hover:border-gold hover:bg-gold/5',
  outline: 'border border-obsidian/25 bg-transparent text-obsidian hover:border-obsidian hover:bg-obsidian/5',
  ghost: 'text-obsidian hover:bg-obsidian/5',
  gold: 'bg-gradient-to-br from-gold to-gold-light text-obsidian shadow-gold hover:from-gold-light hover:to-gold',
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-sm sm:text-base',
  lg: 'px-8 py-3.5 text-base',
};

const spinnerTone: Record<Variant, string> = {
  primary: 'border-gold-pale/30 border-t-gold-pale',
  secondary: 'border-obsidian/25 border-t-obsidian',
  outline: 'border-obsidian/25 border-t-obsidian',
  ghost: 'border-obsidian/25 border-t-obsidian',
  gold: 'border-obsidian/25 border-t-obsidian',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  asChild,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth,
  disabled,
  children,
  ...rest
}: Props) {
  const classes = cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className);

  // asChild delegates rendering to a single child element (Slot), so icons/spinner
  // cannot be injected around it. Pass through untouched — the icon/loading affordances
  // are a convenience for the default <button> path.
  if (asChild) {
    return (
      <Slot className={classes} aria-busy={loading || undefined} {...rest}>
        {children}
      </Slot>
    );
  }

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner className={cn('h-4 w-4', spinnerTone[variant])} label="Loading" />
      ) : (
        leftIcon && (
          <span className="inline-flex shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )
      )}
      <span>{children}</span>
      {!loading && rightIcon && (
        <span className="inline-flex shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
}
