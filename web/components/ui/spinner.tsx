import { cn } from '@/lib/utils';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block h-6 w-6 animate-spin rounded-full border-2 border-gold/25 border-t-gold',
        className,
      )}
    />
  );
}
