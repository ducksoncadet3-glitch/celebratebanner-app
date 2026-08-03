'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OrderStatusBadge } from './order-status-badge';
import { ORDER_STATES, ORDER_STATUSES, nextStatuses } from '@/lib/orders/lifecycle';
import { formatUSD } from '@/lib/pricing';
import type { Order, OrderStatus } from '@/lib/orders/types';

export interface OrderQueueProps {
  initialOrders: Order[];
  /** Admin token echoed back on mutating requests (empty in unsecured dev mode). */
  token: string;
}

type StatusFilter = OrderStatus | 'all';

export function OrderQueue({ initialOrders, token }: OrderQueueProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialOrders[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (q && !o.id.toLowerCase().includes(q) && !o.customerEmail.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [orders, query, statusFilter]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  // Counts per status for the filter chips.
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  async function updateStatus(id: string, to: OrderStatus) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
        body: JSON.stringify({ status: to, actor: 'console' }),
      });
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setActionError(data.error ?? 'Update failed.');
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === id ? data.order! : o)));
    } catch {
      setActionError('Network error — could not update status.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* Queue */}
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label htmlFor="order-search" className="sr-only">
            Search orders by id or email
          </label>
          <input
            id="order-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order id or email…"
            className="w-full rounded-lg border border-obsidian/15 bg-white px-4 py-2.5 text-obsidian placeholder:text-obsidian/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1"
          />
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {(['all', ...ORDER_STATUSES] as StatusFilter[]).map((s) => {
            const active = statusFilter === s;
            const count = counts[s] ?? 0;
            const label = s === 'all' ? 'All' : ORDER_STATES[s].label;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(s)}
                className={
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 ' +
                  (active ? 'bg-obsidian text-gold-pale' : 'bg-obsidian/6 text-obsidian/70 hover:bg-obsidian/10')
                }
              >
                {label} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Order queue</caption>
              <thead className="border-b border-obsidian/8 bg-ivory-dim text-xs uppercase tracking-wide text-obsidian/55">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Order</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Total</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-obsidian/50">
                      No orders match.
                    </td>
                  </tr>
                )}
                {filtered.map((o) => {
                  const isSel = o.id === selectedId;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedId(o.id)}
                      className={
                        'cursor-pointer border-b border-obsidian/5 transition hover:bg-gold/5 ' +
                        (isSel ? 'bg-gold/10' : '')
                      }
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left font-medium text-obsidian focus-visible:outline-none focus-visible:underline"
                          aria-current={isSel ? 'true' : undefined}
                        >
                          {o.id}
                        </button>
                        <span className="block text-xs text-obsidian/55">{o.customerEmail}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-obsidian/80">{formatUSD(o.amountTotalCents)}</td>
                      <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Detail */}
      <div>
        {selected ? (
          <Card as="section" padding="lg" aria-labelledby="detail-heading" className="lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id="detail-heading" className="font-display text-xl font-semibold text-obsidian">
                {selected.id}
              </h2>
              <OrderStatusBadge status={selected.status} />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <Row k="Customer" v={selected.customerName ? `${selected.customerName} · ${selected.customerEmail}` : selected.customerEmail} />
              <Row k="Template" v={selected.templateId} />
              <Row k="Products" v={selected.productIds.join(', ')} />
              <Row k="Total" v={formatUSD(selected.amountTotalCents)} />
              <Row k="Created" v={new Date(selected.createdAt).toLocaleString()} />
              {selected.requiresShipping && selected.shipping && (
                <Row
                  k="Ship to"
                  v={`${selected.shipping.name}, ${selected.shipping.line1}, ${selected.shipping.city} ${selected.shipping.state} ${selected.shipping.postalCode}, ${selected.shipping.country}`}
                />
              )}
            </dl>

            {/* Status update */}
            <div className="mt-5 border-t border-obsidian/8 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-obsidian/55">Advance status</p>
              {nextStatuses(selected.status).length === 0 ? (
                <p className="mt-2 text-sm text-obsidian/60">
                  {ORDER_STATES[selected.status].terminal ? 'Terminal state — no further transitions.' : 'No transitions available.'}
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {nextStatuses(selected.status).map((to) => (
                    <Button key={to} size="sm" variant="secondary" disabled={busy} onClick={() => updateStatus(selected.id, to)}>
                      → {ORDER_STATES[to].label}
                    </Button>
                  ))}
                </div>
              )}
              {actionError && (
                <p role="alert" className="mt-2 text-xs font-medium text-rose">
                  {actionError}
                </p>
              )}
            </div>

            {/* Event timeline */}
            <div className="mt-5 border-t border-obsidian/8 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-obsidian/55">Event log</p>
              <ol className="mt-3 space-y-3">
                {selected.events.map((e) => (
                  <li key={e.id} className="flex gap-3 text-sm">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    <div>
                      <p className="text-obsidian">{e.message}</p>
                      <p className="text-xs text-obsidian/50">
                        {new Date(e.at).toLocaleString()} · {e.scope} · {e.actor}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        ) : (
          <Card padding="lg">
            <p className="text-sm text-obsidian/60">Select an order to view details.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-obsidian/50">{k}</dt>
      <dd className="text-obsidian">{v}</dd>
    </div>
  );
}
