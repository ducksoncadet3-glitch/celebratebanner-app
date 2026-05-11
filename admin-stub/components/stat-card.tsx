import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
}) {
  const toneClass =
    tone === 'good' ? 'border-emerald-200 bg-emerald-50' :
    tone === 'warn' ? 'border-amber-200 bg-amber-50' :
    tone === 'bad'  ? 'border-rose-200 bg-rose-50'   :
    'border-slate-200 bg-white';
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
