import { describe, expect, it } from 'vitest';
import {
  ORDER_STATES,
  ORDER_STATUSES,
  assertTransition,
  canTransition,
  isTerminal,
  nextStatuses,
} from './lifecycle';
import type { OrderStatus } from './types';

describe('order lifecycle model', () => {
  it('has metadata for every status', () => {
    for (const s of ORDER_STATUSES) {
      expect(ORDER_STATES[s]).toBeTruthy();
      expect(ORDER_STATES[s].label).toBeTruthy();
    }
  });

  it('models the happy path pending → paid → rendering → ready → fulfilled', () => {
    expect(canTransition('pending', 'paid')).toBe(true);
    expect(canTransition('paid', 'rendering')).toBe(true);
    expect(canTransition('rendering', 'ready')).toBe(true);
    expect(canTransition('ready', 'fulfilled')).toBe(true);
  });

  it('rejects skipping states and going backwards', () => {
    expect(canTransition('pending', 'ready')).toBe(false);
    expect(canTransition('ready', 'pending')).toBe(false);
    expect(canTransition('paid', 'fulfilled')).toBe(false);
  });

  it('never allows a no-op transition to the same state', () => {
    for (const s of ORDER_STATUSES) expect(canTransition(s, s)).toBe(false);
  });

  it('marks only refunded / canceled as terminal (fulfilled can still be refunded)', () => {
    expect(isTerminal('refunded')).toBe(true);
    expect(isTerminal('canceled')).toBe(true);
    expect(isTerminal('fulfilled')).toBe(false);
    expect(isTerminal('paid')).toBe(false);
  });

  it('terminal states have no outgoing transitions', () => {
    for (const s of ORDER_STATUSES) {
      if (ORDER_STATES[s].terminal) expect(nextStatuses(s)).toEqual([]);
    }
  });

  it('allows recovering a failed order and refunding any paid+ state', () => {
    expect(canTransition('failed', 'paid')).toBe(true);
    expect(canTransition('paid', 'refunded')).toBe(true);
    expect(canTransition('ready', 'refunded')).toBe(true);
    expect(canTransition('fulfilled', 'refunded')).toBe(true);
  });

  it('assertTransition throws typed errors', () => {
    expect(() => assertTransition('pending', 'ready')).toThrowError(/Illegal transition/);
    try {
      assertTransition('pending', 'ready');
    } catch (e) {
      expect((e as { code?: string }).code).toBe('ILLEGAL_TRANSITION');
    }
    try {
      assertTransition('pending', 'bogus' as OrderStatus);
    } catch (e) {
      expect((e as { code?: string }).code).toBe('INVALID_STATUS');
    }
  });
});
