import Link from 'next/link';
import { adminApi } from '@/lib/admin-api';
import { StatCard } from '@/components/stat-card';
import { StatusPill } from '@/components/status-pill';

export const dynamic = 'force-dynamic';

function fmtUSD(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default async function AdminOverview() {
  const overview = await adminApi.overview().catch(() => null);
  if (!overview) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-lg font-semibold">Admin API unreachable</h2>
        <p className="mt-2 text-sm text-slate-600">
          Check that <code>ADMIN_API_BASE_URL</code> + <code>ADMIN_BEARER_TOKEN</code> are set
          and that <code>/api/admin/overview</code> is implemented on celebratebanner-api.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Paid orders" value={overview.totals.paid} hint="all-time" tone="good" />
        <StatCard label="Rendering" value={overview.totals.rendering} hint="in flight" tone="warn" />
        <StatCard label="Ready" value={overview.totals.ready} tone="good" />
        <StatCard label="Failed" value={overview.totals.failed} tone={overview.totals.failed > 0 ? 'bad' : 'default'} />
        <StatCard label="Refunded" value={overview.totals.refunded} />
        <StatCard label="Revenue · 24h" value={fmtUSD(overview.revenue.last24hCents)} />
        <StatCard label="Revenue · 7d" value={fmtUSD(overview.revenue.last7dCents)} />
        <StatCard label="Revenue · 30d" value={fmtUSD(overview.revenue.last30dCents)} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Render queue</h2>
          <Link className="text-sm text-sky-700 hover:underline" href="/queue">View all →</Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Waiting" value={overview.queue.waiting} tone={overview.queue.waiting > 10 ? 'warn' : 'default'} />
          <StatCard label="Active"  value={overview.queue.active} tone="warn" />
          <StatCard label="Failed"  value={overview.queue.failed} tone={overview.queue.failed > 0 ? 'bad' : 'default'} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-600">
          Pick a section from the sidebar to drill in. Operators: refunds and re-renders are
          one-click but irreversible — confirm the customer email before acting.{' '}
          <StatusPill status="ready" /> banners are deliverable.
        </p>
      </section>
    </div>
  );
}
