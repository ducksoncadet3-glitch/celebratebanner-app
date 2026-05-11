const TONES: Record<string, string> = {
  pending:   'bg-slate-100 text-slate-700',
  paid:      'bg-sky-100 text-sky-800',
  rendering: 'bg-amber-100 text-amber-800',
  ready:     'bg-emerald-100 text-emerald-800',
  failed:    'bg-rose-100 text-rose-800',
  refunded:  'bg-purple-100 text-purple-800',
  queued:    'bg-slate-100 text-slate-700',
  running:   'bg-amber-100 text-amber-800',
  done:      'bg-emerald-100 text-emerald-800',
  succeeded: 'bg-emerald-100 text-emerald-800',
};

export function StatusPill({ status }: { status: string }) {
  const tone = TONES[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tone}`}>
      {status}
    </span>
  );
}
