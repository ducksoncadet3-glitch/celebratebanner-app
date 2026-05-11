import { adminApi } from '@/lib/admin-api';
import { StatCard } from '@/components/stat-card';

export const dynamic = 'force-dynamic';
export const revalidate = 5;

export default async function QueuePage() {
  const snap = await adminApi.queue().catch(() => null);
  if (!snap) {
    return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4">Queue API unreachable.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Render queue</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Waiting"   value={snap.waiting}   tone={snap.waiting > 10 ? 'warn' : 'default'} />
        <StatCard label="Active"    value={snap.active}    tone="warn" />
        <StatCard label="Failed"    value={snap.failed}    tone={snap.failed > 0 ? 'bad' : 'default'} />
        <StatCard label="Completed" value={snap.completed} tone="good" />
        <StatCard label="Delayed"   value={snap.delayed} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent failures</h2>
        {snap.failedJobs.length === 0 ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
            No failed jobs. 🎉
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {snap.failedJobs.map((j) => (
              <li key={j.id} className="p-4 text-sm">
                <div className="flex items-center justify-between">
                  <code className="font-mono text-xs text-sky-700">{j.id}</code>
                  <span className="text-xs text-slate-500">{new Date(j.failedAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-slate-700">{j.reason}</p>
                <p className="mt-1 text-xs text-slate-500">project: <code>{j.data.projectId}</code></p>
                <div className="mt-2 flex gap-2">
                  <form action={`/api/admin/queue/${j.id}/retry`} method="post">
                    <button className="rounded bg-slate-900 px-3 py-1 text-xs text-white">Retry</button>
                  </form>
                  <form action={`/api/admin/queue/${j.id}/cancel`} method="post">
                    <button className="rounded border border-slate-300 px-3 py-1 text-xs">Cancel</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
