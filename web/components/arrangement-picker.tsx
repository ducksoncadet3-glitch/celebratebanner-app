'use client';

import { useEffect, useId, useState } from 'react';
import { listArrangements, type ArrangementId } from '@celebratebanner/render-engine';
import { arrangementFit } from '@/lib/arrangement-fit';
import { cn } from '@/lib/utils';

interface Props {
  value: ArrangementId;
  onChange: (id: ArrangementId) => void;
  /**
   * Total photos uploaded, hero included. Drives the compatibility notice.
   * Optional so existing callers keep working; 0 means "nothing uploaded yet".
   */
  photoCount?: number;
}

export function ArrangementPicker({ value, onChange, photoCount = 0 }: Props) {
  const items = listArrangements();
  const fit = arrangementFit(value, photoCount);
  const noticeId = useId();

  // The visible notice updates instantly. The screen-reader announcement is debounced,
  // so adding photos one at a time doesn't produce a stream of interruptions — only the
  // settled result is announced.
  const [announced, setAnnounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setAnnounced(fit.message), 800);
    return () => clearTimeout(t);
  }, [fit.message]);

  return (
    <div>
      {/* Debounced live region — visually hidden, announces only the settled state. */}
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announced}
      </p>

      {!fit.compatible && (
        <div
          id={noticeId}
          role="note"
          className="mb-3 flex items-start gap-2.5 rounded-xl border-2 border-gold/40 bg-gold/5 p-3"
        >
          {/* Decorative: the meaning is carried by the text, never by colour alone. */}
          <svg
            viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"
            className="mt-0.5 shrink-0 text-gold-dark"
            fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 16.5h.01" />
          </svg>
          <p className="text-[12px] leading-relaxed text-obsidian/80">
            <span className="font-semibold text-obsidian">
              {fit.status === 'above-max' ? 'Photo count: ' : 'Suggested photo count: '}
            </span>
            {fit.message}
          </p>
        </div>
      )}

      <ul
        className="grid gap-2 sm:grid-cols-2"
        aria-describedby={fit.compatible ? undefined : noticeId}
      >
        {items.map((a) => {
          const active = a.id === value;
          // What this option would do with the photos already uploaded.
          const optionFit = photoCount > 0 ? arrangementFit(a.id, photoCount) : null;
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
                  {optionFit && optionFit.status === 'above-max' && (
                    <span className="mt-0.5 block text-[11px] font-medium text-obsidian/70">
                      Uses your first {optionFit.used} of {photoCount}
                    </span>
                  )}
                  {optionFit && optionFit.status === 'ok' && photoCount > 0 && (
                    <span className="mt-0.5 block text-[11px] font-medium text-obsidian/70">
                      Uses all {photoCount}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
