import { cn } from '@/lib/utils';

export interface FaqEntry {
  q: string;
  a: string;
}

/**
 * Accessible FAQ accordion built on native <details>/<summary> — keyboard-operable and
 * screen-reader friendly with zero client JavaScript, so it needs no 'use client' and
 * adds no bundle weight.
 */
export function FaqAccordion({
  items,
  className,
}: {
  items: FaqEntry[];
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-3xl divide-y divide-obsidian/10 rounded-xl border border-obsidian/[0.08] bg-white', className)}>
      {items.map((item) => (
        <details key={item.q} className="group p-5 sm:p-6">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-medium text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
            <span>{item.q}</span>
            <span
              className="mt-0.5 shrink-0 text-gold-dark transition-transform duration-200 group-open:rotate-45"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-obsidian/70">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
