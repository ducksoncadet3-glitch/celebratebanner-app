import { memo } from 'react';
import { cn } from '@/lib/utils';

export interface ProofProgressProps {
  /** Ordered step labels. */
  steps: string[];
  /** Zero-based index of the active step. */
  current: number;
  className?: string;
}

/**
 * Accessible wizard progress indicator. Renders an ordered list so assistive tech reads
 * step order and count; the active step is marked with aria-current="step".
 */
function ProofProgressImpl({ steps, current, className }: ProofProgressProps) {
  return (
    <nav aria-label="Proof request progress" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {steps.map((label, i) => {
          const isDone = i < current;
          const isCurrent = i === current;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition',
                  isCurrent && 'bg-obsidian text-gold-pale',
                  isDone && 'text-obsidian',
                  !isCurrent && !isDone && 'text-obsidian/45',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isCurrent && 'bg-gold text-obsidian',
                    isDone && 'bg-sage/20 text-sage',
                    !isCurrent && !isDone && 'bg-obsidian/8 text-obsidian/45',
                  )}
                  aria-hidden="true"
                >
                  {isDone ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </span>
              {i < steps.length - 1 && (
                <span aria-hidden="true" className="h-px w-4 bg-obsidian/15 sm:w-6" />
              )}
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        Step {current + 1} of {steps.length}: {steps[current]}
      </p>
    </nav>
  );
}

export const ProofProgress = memo(ProofProgressImpl);
