'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError, type ProjectStatus } from '@/lib/api';
import { Spinner } from './ui/spinner';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
  /** Poll interval in ms while rendering. Default 2.5s. */
  intervalMs?: number;
  /** Stop polling after this many attempts. Default 120 (~5 min @ 2.5s). */
  maxAttempts?: number;
  onReady?: (status: ProjectStatus) => void;
}

const STAGES = [
  { from: 0,  to: 25,  label: 'Preparing your photos' },
  { from: 25, to: 60,  label: 'Composing the banner' },
  { from: 60, to: 90,  label: 'Rendering at 300 DPI' },
  { from: 90, to: 100, label: 'Finalizing your downloads' },
];

export function ProcessingStatus({ projectId, intervalMs = 2500, maxAttempts = 120, onReady }: Props) {
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attempts = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function tick() {
      if (cancelled) return;
      attempts.current += 1;
      try {
        const s = await api.getProjectStatus(projectId);
        if (cancelled) return;
        setStatus(s);
        if (s.status === 'ready') {
          onReady?.(s);
          return;
        }
        if (s.status === 'failed' || s.status === 'refunded') return;
        if (attempts.current >= maxAttempts) {
          setError('Render is taking longer than usual — we&apos;ll email you when it&apos;s ready.');
          return;
        }
        timer = window.setTimeout(tick, intervalMs);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof ApiError ? err.message : 'Could not reach server';
        setError(msg);
        timer = window.setTimeout(tick, intervalMs * 2);
      }
    }
    tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [projectId, intervalMs, maxAttempts, onReady]);

  const progress = status?.renderProgress ?? 5;
  const stage = STAGES.find((s) => progress >= s.from && progress < s.to) ?? STAGES[STAGES.length - 1];

  return (
    <div className="rounded-2xl border border-gold/20 bg-white p-7 shadow-lift">
      <div className="flex items-center gap-3">
        {status?.status === 'ready' ? (
          <span aria-hidden className="text-2xl text-sage">✓</span>
        ) : (
          <Spinner />
        )}
        <p className="font-medium">
          {status?.status === 'ready' ? 'Your banner is ready' : stage.label}
        </p>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-gold/10">
        <div
          className={cn(
            'h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-700',
            status?.status === 'ready' && 'from-sage to-sage',
          )}
          style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-obsidian/55">
        Project: <code className="font-mono">{projectId}</code>
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
