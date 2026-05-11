'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 50;
const ACCEPT = 'image/jpeg,image/png,image/webp';

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  width?: number;
  height?: number;
}

interface Props {
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  heroId: string | null;
  onHeroChange: (id: string | null) => void;
}

export function PhotoUploader({ value, onChange, heroId, onHeroChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const accept = useCallback(
    (incoming: FileList | File[]) => {
      const all = Array.from(incoming).filter((f) => /^image\/(jpe?g|png|webp)$/i.test(f.type));
      if (all.length === 0) return;
      const room = MAX_PHOTOS - value.length;
      const next = all.slice(0, room).map((f) => ({
        id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 6)}`,
        file: f,
        previewUrl: URL.createObjectURL(f),
      }));
      onChange([...value, ...next]);
      if (!heroId && next.length > 0) onHeroChange(next[0].id);
    },
    [value, onChange, heroId, onHeroChange],
  );

  function remove(id: string) {
    const removed = value.find((v) => v.id === id);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    onChange(value.filter((v) => v.id !== id));
    if (heroId === id) {
      const remaining = value.filter((v) => v.id !== id);
      onHeroChange(remaining[0]?.id ?? null);
    }
  }

  return (
    <div>
      <div
        className={cn(
          'rounded-2xl border-2 border-dashed bg-white px-6 py-12 text-center transition',
          dragging ? 'border-gold bg-gold/5' : 'border-gold/30 hover:border-gold/60',
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) accept(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
          <svg viewBox="0 0 24 24" className="h-6 w-6" stroke="currentColor" fill="none" strokeWidth="1.7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" />
          </svg>
        </div>
        <p className="mt-4 font-medium">Drag & drop your photos here</p>
        <p className="mt-1 text-sm text-obsidian/60">
          or click to browse — JPG, PNG, WebP · up to {MAX_PHOTOS} photos
        </p>
        <p className="mt-2 text-xs text-obsidian/45">
          {value.length} / {MAX_PHOTOS} uploaded · minimum 150 DPI recommended
        </p>
      </div>

      {value.length > 0 && (
        <>
          <p className="mt-6 text-xs text-obsidian/60">
            💡 <strong>Tap a photo</strong> to set it as your hero. Use ✕ to remove.
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
            {value.map((p) => {
              const isHero = p.id === heroId;
              return (
                <li
                  key={p.id}
                  className={cn(
                    'group relative aspect-square overflow-hidden rounded-lg border-2 bg-obsidian-50 transition',
                    isHero ? 'border-gold shadow-gold' : 'border-transparent hover:border-gold/40',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onHeroChange(p.id)}
                    className="absolute inset-0"
                    aria-label={isHero ? 'Hero photo' : `Set ${p.file.name} as hero`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  </button>
                  {isHero && (
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gold py-0.5 text-center text-[9px] font-bold uppercase tracking-widest text-obsidian">
                      Hero
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="absolute right-1 top-1 hidden h-6 w-6 items-center justify-center rounded-full bg-obsidian/80 text-xs text-ivory hover:bg-obsidian group-hover:flex"
                    aria-label={`Remove ${p.file.name}`}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
