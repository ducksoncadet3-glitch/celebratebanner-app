import Link from 'next/link';
import { adminApi } from '@/lib/admin-api';
import { StatusPill } from '@/components/status-pill';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const rows = await adminApi.listPayments(params).catch(() => []);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <form className="flex gap-2 text-sm">
          <input
            type="search"
            name="email"
            defaultValue={params.email ?? ''}
            placeholder="customer email"
            className="rounded-md border-slate-300 px-2 py-1"
          />
          <button className="rounded-md bg-slate-900 px-3 py-1 text-white">Filter</button>
        </form>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Products</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Project</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No payments.</td></tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">${(p.amountTotalCents / 100).toFixed(2)}</td>
                <td className="px-4 py-2">{p.productIds.join(' + ') || '—'}</td>
                <td className="px-4 py-2">{p.customerEmail ?? '—'}</td>
                <td className="px-4 py-2">
                  {p.projectId ? (
                    <Link href={`/projects/${p.projectId}`} className="font-mono text-xs text-sky-700 hover:underline">
                      {p.projectId}
                    </Link>
                  ) : '—'}
                </td>
                <td className="px-4 py-2"><StatusPill status={p.status} /></td>
                <td className="px-4 py-2 text-xs text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
