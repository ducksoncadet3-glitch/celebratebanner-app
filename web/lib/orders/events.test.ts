import { describe, expect, it, vi } from 'vitest';
import { logOperationalEvent, makeOrderEvent } from './events';

describe('makeOrderEvent', () => {
  it('builds a fully-shaped event with injected id + timestamp', () => {
    const e = makeOrderEvent(
      { orderId: 'proj_1', scope: 'payment', message: 'paid', actor: 'webhook', metadata: { cents: 999 } },
      { at: '2026-07-23T00:00:00.000Z', id: 'evt_fixed' },
    );
    expect(e).toEqual({
      id: 'evt_fixed',
      orderId: 'proj_1',
      scope: 'payment',
      at: '2026-07-23T00:00:00.000Z',
      message: 'paid',
      actor: 'webhook',
      metadata: { cents: 999 },
    });
  });

  it('defaults actor to system', () => {
    expect(makeOrderEvent({ orderId: 'p', scope: 'note', message: 'x' }, { at: 't', id: 'i' }).actor).toBe('system');
  });
});

describe('logOperationalEvent', () => {
  it('returns the event and emits a structured [ops] line', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const e = logOperationalEvent(
      { orderId: 'proj_9', scope: 'fulfillment', message: 'shipped' },
      'info',
      { at: 't', id: 'i' },
    );
    expect(e.scope).toBe('fulfillment');
    expect(spy).toHaveBeenCalledWith('[ops]', expect.stringContaining('"tag":"ops"'));
    spy.mockRestore();
  });

  it('routes warn/error to the right console channel and never throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => logOperationalEvent({ orderId: 'p', scope: 'payment', message: 'm' }, 'warn', { at: 't', id: 'i' })).not.toThrow();
    expect(() => logOperationalEvent({ orderId: 'p', scope: 'payment', message: 'm' }, 'error', { at: 't', id: 'i' })).not.toThrow();
    expect(warn).toHaveBeenCalled();
    expect(error).toHaveBeenCalled();
    warn.mockRestore();
    error.mockRestore();
  });
});
