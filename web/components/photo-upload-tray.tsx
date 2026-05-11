'use client';

import { useCallback, useRef, useState } from 'react';
import type { PhotoMeta } from '@/lib/render-input.schema';
import { uploadMany, type UploadProgress } from '@/lib/uploads';
import { cn } from '@/lib/utils';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX = 50;

interface Props {
  projectId: string;
  photos: PhotoMeta[];
  heroId: string | null;
  onAdd: (photos: PhotoMeta[]) => void;
  onRemove: (id: string) => void;
  onSetHero: (id: string) => void;
  onRotate: (id: string) => void;
  rotations: Record<string, number>;
}

export function PhotoUploadTray({ projectId, photos, heroId, onAdd, onRemove, onSetHero, onRotate, rotations }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<Record<string, UploadProgress>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const ingest = useCallback(
    async (incoming: FileList | File[]) => {
      const files = Array.from(incoming).filter((f) => /^image\/(jpe?g|png|webp)$/i.test(f.type));
      if (files.length === 0) return;
      const room = MAX - photos.length;
      const chosen = files.slice(0, room);
      setBusy(true);
      setErrors([]);
      const results = await uploadMany(projectId, chosen, (p) =>
        setProgress((prev) => ({ ...prev, [p.filename]: p })),
      );
      setBusy(false);
      const ok: PhotoMeta[] = [];
      const failed: string[] = [];
      results.forEach((r, i) => {
        if (r.ok && r.photo) ok.push(r.photo);
        else failed.push(`${chosen[i]?.name ?? 'photo'}: ${r.error ?? 'failed'}`);
      });
      if (ok.length > 0) onAdd(ok);
      if (failed.length > 0) setErrors(failed);
      setProgress({});
    },
    [projectId, photos.length, onAdd],
  );

  return (
    <div>
      <div
        className={cn(
          'rounded-2xl border-2 border-dashed bg-white px-6 py-10 text-center transition',
          dragging ? 'border-gold bg-gold/5' : 'border-gold/30 hover:border-gold/60',
        )}
        role="button"
        tabIndex={0}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void ingest(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
        aria-disabled={busy}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void ingest(e.target.files);
            e.target.value = '';
          }}
        />
        <p className="font-medium">Drag & drop your photos here</p>
        <p className="mt-1 text-sm text-obsidian/60">
          JPG · PNG · WebP — up to {MAX} photos · {photos.length}/{MAX} uploaded
        </p>
        {busy && (
          <p className="mt-3 text-xs text-gold-dark">Uploading… {Object.values(progress).length} in flight</p>
        )}
      </div>

      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-rose">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}

      {photos.length > 0 && (
        <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {photos.map((p) => {
            const isHero = p.id === heroId;
            const rot = rotations[p.id] ?? 0;
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
                  onClick={() => onSetHero(p.id)}
                  className="absolute inset-0"
                  aria-label={isHero ? 'Hero photo' : 'Set as hero'}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ transform: rot ? `rotate(${rot}deg)` : undefined }}
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
                  onClick={() => onRotate(p.id)}
                  className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-obsidian/80 text-xs text-gold hover:bg-obsidian hidden group-hover:flex"
                  aria-label="Rotate 90°"
                >
                  ↻
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  className="absolute left-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-obsidian/80 text-xs text-ivory hover:bg-obsidian hidden group-hover:flex"
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
