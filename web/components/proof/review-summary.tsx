import { memo } from 'react';
import { labelFor, productTitle, FORMAT_OPTIONS, SIZE_OPTIONS } from '@/lib/proof/options';
import type { ProofFormData } from '@/lib/proof/types';

export interface ReviewSummaryProps {
  data: ProofFormData;
  /** Jump back to a given step to edit (optional). */
  onEdit?: (step: number) => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-40 shrink-0 text-sm font-medium text-obsidian/50">{label}</dt>
      <dd className="text-sm text-obsidian">{value || '—'}</dd>
    </div>
  );
}

function Group({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit?: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-obsidian/10 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-sans text-sm font-semibold uppercase tracking-wide text-obsidian/70">{title}</h3>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(step)}
            className="rounded text-sm font-medium text-gold-dark underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1"
          >
            Edit
          </button>
        )}
      </div>
      <dl className="space-y-2.5">{children}</dl>
    </section>
  );
}

/**
 * Read-only summary of everything the user entered, shown before submit. Each group can be
 * edited in place by jumping back to its step, so the user never loses data to make a fix.
 */
function ReviewSummaryImpl({ data, onEdit }: ReviewSummaryProps) {
  const { team, preferences } = data;
  return (
    <div className="space-y-4">
      <Group title="Product" step={0} onEdit={onEdit}>
        <Row label="Selected" value={productTitle(data.productId)} />
      </Group>

      <Group title="Team & contact" step={1} onEdit={onEdit}>
        <Row label="Team / event" value={team.teamName} />
        <Row label="Contact name" value={team.contactName} />
        <Row label="Email" value={team.email} />
        <Row label="Phone" value={team.phone} />
      </Group>

      <Group title="Design preferences" step={2} onEdit={onEdit}>
        <Row label="Team colors" value={preferences.colors} />
        <Row label="Preferred size" value={labelFor(SIZE_OPTIONS, preferences.size)} />
        <Row label="Format" value={labelFor(FORMAT_OPTIONS, preferences.format)} />
        <Row label="Notes" value={preferences.notes} />
      </Group>
    </div>
  );
}

export const ReviewSummary = memo(ReviewSummaryImpl);
