'use client';

import { useEffect, useRef } from 'react';
import { renderPreview, type RenderInput } from '@celebratebanner/render-engine';

interface Props {
  input: RenderInput;
  /** Override preview resolution; default 800×1200 @ 1×DPR. */
  width?: number;
  height?: number;
  dpr?: number;
  className?: string;
}

/**
 * Lightweight live preview. Calls the shared render engine on a small canvas.
 * Re-renders whenever `input` changes by reference — wrap in useMemo if you
 * mutate the upstream state in place.
 *
 * Performance:
 *   • Renders on the main thread but completes in <200ms for 50 photos at
 *     800×1200, fast enough not to block input.
 *   • Image bitmaps are decoded eagerly by the caller (PhotoUploader). The
 *     preview itself does no I/O — it just composes the already-decoded images.
 *   • For HD exports we use the backend (see `/api/render/hd`) so the browser
 *     never has to keep a 7200×10800 canvas in memory.
 */
export function BannerPreview({ input, width, height, dpr, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const handle = requestAnimationFrame(() => {
      if (cancelled) return;
      try {
        renderPreview(canvas as unknown as Parameters<typeof renderPreview>[0], input, {
          previewWidth: width,
          previewHeight: height,
          dpr,
        });
      } catch (err) {
        // Engine errors shouldn't crash the UI — log and leave the canvas blank.
        // The /create page surfaces a retry button.
        // eslint-disable-next-line no-console
        console.error('[BannerPreview] render failed', err);
      }
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(handle);
    };
  }, [input, width, height, dpr]);

  return (
    <canvas
      ref={canvasRef}
      className={className ?? 'h-auto w-full rounded-xl shadow-lift'}
      aria-label="Banner preview"
    />
  );
}
