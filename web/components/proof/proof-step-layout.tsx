import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ReactNode } from 'react';

export interface ProofStepLayoutProps {
  headingId: string;
  title: string;
  description?: string;
  children: ReactNode;
  /** Omit to hide the Back button (first step). */
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
  /** Shows a spinner + disables the primary action (submit in flight). */
  isSubmitting?: boolean;
}

/**
 * Consistent chrome for every wizard step: a titled Card with the step content and a
 * Back/Next footer. The heading is focusable (tabIndex -1) so the wizard can move focus
 * here on step change, which keeps keyboard and screen-reader users oriented.
 */
export const ProofStepLayout = forwardRef<HTMLHeadingElement, ProofStepLayoutProps>(
  function ProofStepLayout(
    { headingId, title, description, children, onBack, onNext, nextLabel = 'Continue', backLabel = 'Back', isSubmitting },
    ref,
  ) {
    return (
      <Card padding="none" className="overflow-hidden">
        <div className="border-b border-obsidian/8 px-6 py-6 sm:px-8">
          <h2
            id={headingId}
            ref={ref}
            tabIndex={-1}
            className="font-display text-2xl font-semibold text-obsidian focus-visible:outline-none sm:text-3xl"
          >
            {title}
          </h2>
          {description && <p className="mt-2 text-sm leading-relaxed text-obsidian/60">{description}</p>}
        </div>

        <div className="px-6 py-6 sm:px-8">{children}</div>

        <div className="flex items-center justify-between gap-3 border-t border-obsidian/8 bg-ivory-dim px-6 py-4 sm:px-8">
          {onBack ? (
            <Button variant="ghost" onClick={onBack} type="button">
              ← {backLabel}
            </Button>
          ) : (
            <span />
          )}
          <Button variant="gold" onClick={onNext} type="button" loading={isSubmitting}>
            {nextLabel}
          </Button>
        </div>
      </Card>
    );
  },
);
