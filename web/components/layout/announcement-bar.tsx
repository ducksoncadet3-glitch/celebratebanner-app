import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

/**
 * Slim top-of-page announcement strip. Defaults to the free-proof message; pass
 * `children` to override.
 */
export function AnnouncementBar({
  children = (
    <>
      <span aria-hidden="true">✦</span> FREE Design Proof Before You Order
    </>
  ),
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="region"
      aria-label="Announcement"
      className={cn(
        'bg-obsidian text-gold-pale',
        className,
      )}
    >
      <p className="container-page flex items-center justify-center gap-2 py-2 text-center text-xs font-medium tracking-[0.14em] sm:text-sm">
        {children}
      </p>
    </div>
  );
}
