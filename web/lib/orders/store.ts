/**
 * Order store.
 *
 * An in-process store that powers the lightweight admin queue. It is intentionally simple
 * and dependency-free so the queue builds and demos without a live Postgres. In production
 * the SAME interface (list/get/updateStatus) is implemented by an adapter over the backend
 * admin API (routes/admin.js) — swap `createOrderStore` for that adapter and the UI is
 * unchanged. Kept modular precisely so that swap is a one-file change.
 *
 * Status changes go through the lifecycle model, so an illegal transition is rejected here
 * regardless of which caller (UI, API route) requested it.
 */

import { assertTransition } from './lifecycle';
import { makeOrderEvent } from './events';
import type { Order, OrderListQuery, OrderStatus, OrderSummary } from './types';

export interface OrderStore {
  list(query?: OrderListQuery): Promise<OrderSummary[]>;
  get(id: string): Promise<Order | null>;
  updateStatus(id: string, to: OrderStatus, actor: string, note?: string): Promise<Order>;
}

function toSummary(o: Order): OrderSummary {
  return {
    id: o.id,
    customerEmail: o.customerEmail,
    templateId: o.templateId,
    productIds: o.productIds,
    amountTotalCents: o.amountTotalCents,
    currency: o.currency,
    status: o.status,
    requiresShipping: o.requiresShipping,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function clone(o: Order): Order {
  return { ...o, productIds: [...o.productIds], events: o.events.map((e) => ({ ...e })) };
}

/** Which operational scope a transition should also be logged under. */
function scopeForStatus(to: OrderStatus): 'payment' | 'rendering' | 'fulfillment' | 'status_change' {
  if (to === 'paid' || to === 'refunded') return 'payment';
  if (to === 'rendering' || to === 'ready') return 'rendering';
  if (to === 'fulfilled') return 'fulfillment';
  return 'status_change';
}

export function createOrderStore(seed: Order[] = []): OrderStore {
  const orders = new Map<string, Order>(seed.map((o) => [o.id, clone(o)]));

  return {
    async list(query = {}) {
      const q = query.q?.trim().toLowerCase();
      let items = [...orders.values()];
      if (query.status) items = items.filter((o) => o.status === query.status);
      if (q) {
        items = items.filter(
          (o) => o.id.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q),
        );
      }
      items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return items.map(toSummary);
    },

    async get(id) {
      const o = orders.get(id);
      return o ? clone(o) : null;
    },

    async updateStatus(id, to, actor, note) {
      const current = orders.get(id);
      if (!current) throw Object.assign(new Error('Order not found'), { code: 'NOT_FOUND' });

      // Throws INVALID_STATUS / ILLEGAL_TRANSITION — surfaced as 4xx by the API layer.
      assertTransition(current.status, to);

      const from = current.status;
      const at = new Date().toISOString();
      const statusEvent = makeOrderEvent(
        {
          orderId: id,
          scope: scopeForStatus(to),
          message: `Status ${from} → ${to}${note ? `: ${note}` : ''}`,
          actor,
          metadata: { from, to },
        },
        { at },
      );

      const updated: Order = {
        ...clone(current),
        status: to,
        updatedAt: at,
        events: [statusEvent, ...current.events.map((e) => ({ ...e }))],
      };
      orders.set(id, updated);
      return clone(updated);
    },
  };
}

// ── Default singleton for the app (demo data) ────────────────────────────────
// Timestamps are hard-coded so the demo is stable across renders/tests.
const DEMO_ORDERS: Order[] = [
  {
    id: 'proj_demo_a1b2c3',
    customerEmail: 'coach.rivera@example.com',
    customerName: 'Coach Rivera',
    templateId: 'champion',
    productIds: ['print'],
    amountTotalCents: 4900,
    currency: 'usd',
    status: 'paid',
    requiresShipping: true,
    shipping: {
      name: 'Coach Rivera',
      line1: '88 Stadium Way',
      city: 'West Palm Beach',
      state: 'FL',
      postalCode: '33401',
      country: 'US',
    },
    createdAt: '2026-07-20T14:02:00.000Z',
    updatedAt: '2026-07-20T14:05:00.000Z',
    events: [
      makeOrderEvent({ orderId: 'proj_demo_a1b2c3', scope: 'checkout', message: 'Checkout started', actor: 'customer' }, { at: '2026-07-20T14:02:00.000Z', id: 'evt_seed_1' }),
      makeOrderEvent({ orderId: 'proj_demo_a1b2c3', scope: 'payment', message: 'Payment succeeded ($49.00)', actor: 'webhook' }, { at: '2026-07-20T14:05:00.000Z', id: 'evt_seed_2' }),
    ],
  },
  {
    id: 'proj_demo_d4e5f6',
    customerEmail: 'maya.grad@example.com',
    customerName: 'Maya P.',
    templateId: 'graduation',
    productIds: ['digital'],
    amountTotalCents: 999,
    currency: 'usd',
    status: 'ready',
    requiresShipping: false,
    createdAt: '2026-07-21T09:30:00.000Z',
    updatedAt: '2026-07-21T09:33:00.000Z',
    events: [
      makeOrderEvent({ orderId: 'proj_demo_d4e5f6', scope: 'payment', message: 'Payment succeeded ($9.99)', actor: 'webhook' }, { at: '2026-07-21T09:31:00.000Z', id: 'evt_seed_3' }),
      makeOrderEvent({ orderId: 'proj_demo_d4e5f6', scope: 'rendering', message: 'Render complete', actor: 'system' }, { at: '2026-07-21T09:33:00.000Z', id: 'evt_seed_4' }),
    ],
  },
  {
    id: 'proj_demo_g7h8i9',
    customerEmail: 'booster@example.com',
    templateId: 'champion',
    productIds: ['print', 'video'],
    amountTotalCents: 6800,
    currency: 'usd',
    status: 'pending',
    requiresShipping: true,
    createdAt: '2026-07-22T18:45:00.000Z',
    updatedAt: '2026-07-22T18:45:00.000Z',
    events: [
      makeOrderEvent({ orderId: 'proj_demo_g7h8i9', scope: 'checkout', message: 'Checkout started', actor: 'customer' }, { at: '2026-07-22T18:45:00.000Z', id: 'evt_seed_5' }),
    ],
  },
];

let singleton: OrderStore | null = null;

/** The app-wide store. Demo data by default; replace with a backend adapter in production. */
export function getOrderStore(): OrderStore {
  if (!singleton) singleton = createOrderStore(DEMO_ORDERS);
  return singleton;
}
