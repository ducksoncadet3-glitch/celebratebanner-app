import { memo } from 'react';
import { cn } from '@/lib/utils';

export interface TrustFeatureItem {
  icon: string;
  title: string;
  description: string;
}

/**
 * A responsive grid of trust/benefit features. Decorative icons are aria-hidden;
 * each feature is a titled block for screen readers.
 */
function TrustGridImpl({
  features,
  className,
}: {
  features: TrustFeatureItem[];
  className?: string;
}) {
  return (
    <ul
      className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-4', className)}
      role="list"
    >
      {features.map((f) => (
        <li
          key={f.title}
          className="rounded-xl border border-obsidian/[0.08] bg-white p-6 shadow-[0_2px_12px_-6px_rgba(12,14,20,0.12)]"
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold/12 text-xl text-gold-dark"
            aria-hidden="true"
          >
            {f.icon}
          </span>
          <h3 className="mt-4 font-sans text-base font-semibold text-obsidian">{f.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-obsidian/60">{f.description}</p>
        </li>
      ))}
    </ul>
  );
}

export const TrustGrid = memo(TrustGridImpl);
