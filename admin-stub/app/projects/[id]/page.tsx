import { notFound } from 'next/navigation';
import { adminApi } from '@/lib/admin-api';
import { StatusPill } from '@/components/status-pill';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await adminApi.getProject(id).catch(() => null);
  if (!p) notFound();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-slate-500">{p.id}</p>
          <h1 className="mt-1 text-2xl font-semibold">{p.customerEmail ?? 'Anonymous'}</h1>
          <p className="text-sm text-slate-500">
            {p.templateId} · {p.arrangement} · rev {p.rev}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill status={p.status} />
          <form action={`/api/admin/projects/${p.id}/rerender`} method="post">
            <button className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white">Re-render HD</button>
          </form>
          <form action={`/api/admin/projects/${p.id}/refund`} method="post">
            <button className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700">Refund</button>
          </form>
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Render history</h2>
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {p.renders.length === 0 && (
            <li className="p-4 text-sm text-slate-500">No renders yet.</li>
          )}
          {p.renders.map((r) => (
            <li key={r.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <code className="font-mono text-xs">{r.id}</code>
                <p className="text-xs text-slate-500">
                  {new Date(r.createdAt).toLocaleString()}
                  {r.durationMs != null && ` · ${(r.durationMs / 1000).toFixed(1)}s`}
                </p>
                {r.errorMessage && <p className="mt-1 text-xs text-rose-700">{r.errorMessage}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{r.progress}%</span>
                <StatusPill status={r.status} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Payments</h2>
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {p.payments.length === 0 && (
            <li className="p-4 text-sm text-slate-500">No payments.</li>
          )}
          {p.payments.map((pay) => (
            <li key={pay.id} className="flex items-center justify-between p-4 text-sm">
              <div>
                <span className="font-medium">${(pay.amountTotalCents / 100).toFixed(2)}</span>
                <span className="ml-2 text-xs text-slate-500">{pay.productIds.join(' + ')}</span>
                <p className="text-xs text-slate-500">{new Date(pay.createdAt).toLocaleString()}</p>
              </div>
              <StatusPill status={pay.status} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">RenderInput</h2>
        <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
          {JSON.stringify(p.renderInput, null, 2)}
        </pre>
      </section>
    </div>
  );
}
