/**
 * Order lifecycle / state model.
 *
 * A single source of truth for what an order's status means and which transitions are
 * legal. Pure and framework-free so it can be unit-tested and reused by the admin UI, the
 * API route handlers, and (conceptually) the backend worker.
 *
 *   pending ──pay──► paid ──enqueue──► rendering ──done──► ready ──ship/deliver──► fulfilled
 *      │                │                   │                │                        │
 *      ├──cancel──► canceled                └──fail──► failed ◄───────fail───────┘    │
 *      │                                        │                                     │
 *      └──────────── (all paid+ states) ────────┴────────refund──────► refunded ◄─────┘
 */

import type { OrderStatus } from './types';

export interface StateMeta {
  label: string;
  /** Maps onto the Badge variants used across the app. */
  tone: 'info' | 'success' | 'warning' | 'featured' | 'neutral';
  description: string;
  terminal: boolean;
}

export const ORDER_STATES: Record<OrderStatus, StateMeta> = {
  pending: { label: 'Pending', tone: 'neutral', description: 'Awaiting payment.', terminal: false },
  paid: { label: 'Paid', tone: 'info', description: 'Payment received; ready to render.', terminal: false },
  rendering: { label: 'Rendering', tone: 'info', description: 'HD render in progress.', terminal: false },
  ready: { label: 'Ready', tone: 'success', description: 'Files rendered and available.', terminal: false },
  fulfilled: { label: 'Fulfilled', tone: 'success', description: 'Delivered / shipped to the customer.', terminal: false },
  failed: { label: 'Failed', tone: 'warning', description: 'Payment or render failed; needs attention.', terminal: false },
  refunded: { label: 'Refunded', tone: 'warning', description: 'Payment refunded.', terminal: true },
  canceled: { label: 'Canceled', tone: 'neutral', description: 'Abandoned before payment.', terminal: true },
};

export const ORDER_STATUSES = Object.keys(ORDER_STATES) as OrderStatus[];

/** Allowed forward transitions per status. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'canceled', 'failed'],
  paid: ['rendering', 'refunded', 'failed'],
  rendering: ['ready', 'failed'],
  ready: ['fulfilled', 'refunded'],
  fulfilled: ['refunded'],
  failed: ['paid', 'rendering', 'canceled'],
  refunded: [],
  canceled: [],
};

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  return nextStatuses(from).includes(to);
}

export function isTerminal(status: OrderStatus): boolean {
  return ORDER_STATES[status]?.terminal ?? false;
}

/** Throwing guard for the API layer — returns a typed Error with a 409-friendly message. */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!ORDER_STATES[to]) {
    throw Object.assign(new Error(`Unknown status "${to}"`), { code: 'INVALID_STATUS' });
  }
  if (!canTransition(from, to)) {
    throw Object.assign(new Error(`Illegal transition ${from} → ${to}`), { code: 'ILLEGAL_TRANSITION' });
  }
}
