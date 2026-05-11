'use client';

import { listArrangements, type ArrangementId } from '@celebratebanner/render-engine';
import { cn } from '@/lib/utils';

interface Props {
  value: ArrangementId;
  onChange: (id: ArrangementId) => void;
}

export function ArrangementPicker({ value, onChange }: Props) {
  const items = listArrangements();
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((a) => {
        const active = a.id === value;
        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onChange(a.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition',
                active
                  ? 'border-gold bg-gold/5 shadow-gold'
                  : 'border-gold/15 bg-white hover:border-gold/40',
              )}
              aria-pressed={active}
            >
              <span className={cn('mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold', active ? 'border-gold bg-gold text-obsidian' : 'border-gold/30 text-obsidian/40')}>
                {active ? '✓' : ''}
              </span>
              <span>
                <span className="block text-sm font-semibold">{a.label}</span>
                <span className="block text-[11px] text-obsidian/55">
                  Best with {a.minPhotos}–{a.maxPhotos} photos
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
