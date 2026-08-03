import { describe, expect, it } from 'vitest';
import { createOrderStore } from './store';
import { makeOrderEvent } from './events';
import type { Order } from './types';

function order(partial: Partial<Order> & Pick<Order, 'id' | 'status'>): Order {
  return {
    customerEmail: `${partial.id}@example.com`,
    templateId: 'champion',
    productIds: ['print'],
    amountTotalCents: 4900,
    currency: 'usd',
    requiresShipping: true,
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: '2026-07-20T10:00:00.000Z',
    events: [makeOrderEvent({ orderId: partial.id, scope: 'checkout', message: 'created' }, { at: '2026-07-20T10:00:00.000Z', id: 'seed' })],
    customerName: undefined,
    ...partial,
  };
}

const seed: Order[] = [
  order({ id: 'proj_paid', status: 'paid', customerEmail: 'alice@team.com', createdAt: '2026-07-20T10:00:00.000Z' }),
  order({ id: 'proj_ready', status: 'ready', customerEmail: 'bob@team.com', createdAt: '2026-07-21T10:00:00.000Z' }),
  order({ id: 'proj_pending', status: 'pending', customerEmail: 'carol@team.com', createdAt: '2026-07-22T10:00:00.000Z' }),
];

describe('order store — list search + filter', () => {
  it('returns all, newest first', async () => {
    const store = createOrderStore(seed);
    const all = await store.list();
    expect(all.map((o) => o.id)).toEqual(['proj_pending', 'proj_ready', 'proj_paid']);
  });

  it('filters by status', async () => {
    const store = createOrderStore(seed);
    const paid = await store.list({ status: 'paid' });
    expect(paid.map((o) => o.id)).toEqual(['proj_paid']);
  });

  it('searches by id and email, case-insensitively', async () => {
    const store = createOrderStore(seed);
    expect((await store.list({ q: 'READY' })).map((o) => o.id)).toEqual(['proj_ready']);
    expect((await store.list({ q: 'bob@' })).map((o) => o.id)).toEqual(['proj_ready']);
  });

  it('combines status + search', async () => {
    const store = createOrderStore(seed);
    expect(await store.list({ status: 'paid', q: 'bob' })).toEqual([]);
  });
});

describe('order store — get', () => {
  it('returns a deep copy (mutation-safe)', async () => {
    const store = createOrderStore(seed);
    const a = await store.get('proj_paid');
    a!.productIds.push('video');
    const b = await store.get('proj_paid');
    expect(b!.productIds).toEqual(['print']);
  });

  it('returns null for unknown id', async () => {
    expect(await createOrderStore(seed).get('nope')).toBeNull();
  });
});

describe('order store — updateStatus', () => {
  it('applies a legal transition and prepends a status_change event', async () => {
    const store = createOrderStore(seed);
    const updated = await store.updateStatus('proj_paid', 'rendering', 'admin:test');
    expect(updated.status).toBe('rendering');
    expect(updated.events[0].scope).toBe('rendering');
    expect(updated.events[0].message).toContain('paid → rendering');
    expect(updated.events[0].actor).toBe('admin:test');
    // persisted
    expect((await store.get('proj_paid'))!.status).toBe('rendering');
  });

  it('logs fulfillment scope when moving ready → fulfilled', async () => {
    const store = createOrderStore(seed);
    const updated = await store.updateStatus('proj_ready', 'fulfilled', 'admin:test', 'shipped via USPS');
    expect(updated.status).toBe('fulfilled');
    expect(updated.events[0].scope).toBe('fulfillment');
    expect(updated.events[0].message).toContain('shipped via USPS');
  });

  it('rejects an illegal transition without mutating', async () => {
    const store = createOrderStore(seed);
    await expect(store.updateStatus('proj_pending', 'ready', 'admin:test')).rejects.toMatchObject({
      code: 'ILLEGAL_TRANSITION',
    });
    expect((await store.get('proj_pending'))!.status).toBe('pending');
  });

  it('throws NOT_FOUND for an unknown order', async () => {
    await expect(createOrderStore(seed).updateStatus('nope', 'paid', 'admin:test')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
