import { memo } from 'react';
import { cn } from '@/lib/utils';

export interface ProcessStepItem {
  title: string;
  description: string;
}

/**
 * Numbered process steps rendered as an ordered list (semantic + accessible). The visible
 * number badges are decorative; the <ol> conveys order to assistive tech.
 */
function ProcessStepsImpl({
  steps,
  className,
}: {
  steps: ProcessStepItem[];
  className?: string;
}) {
  return (
    <ol className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-5', className)}>
      {steps.map((s, i) => (
        <li key={s.title} className="text-center">
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-light font-sans text-lg font-extrabold text-obsidian shadow-gold"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <h3 className="mt-4 font-sans text-sm font-semibold text-obsidian">{s.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-obsidian/60">{s.description}</p>
        </li>
      ))}
    </ol>
  );
}

export const ProcessSteps = memo(ProcessStepsImpl);
