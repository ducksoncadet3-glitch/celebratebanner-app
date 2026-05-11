'use client';

import { listFrames, type FrameId } from '@celebratebanner/render-engine';
import { cn } from '@/lib/utils';

interface Props {
  value: FrameId;
  onChange: (id: FrameId) => void;
}

export function FramePicker({ value, onChange }: Props) {
  const frames = listFrames();
  return (
    <div className="flex flex-wrap gap-1.5">
      {frames.map((f) => {
        const active = f.id === value;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[11px] font-semibold transition',
              active
                ? 'bg-obsidian text-gold shadow-gold'
                : 'border border-gold/25 bg-white text-obsidian/70 hover:border-gold/55',
            )}
            aria-pressed={active}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
