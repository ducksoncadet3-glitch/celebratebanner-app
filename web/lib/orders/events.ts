/**
 * Operational event logging for the order pipeline.
 *
 * Two concerns, kept separate:
 *   • makeOrderEvent(...) — PURE builder for an OrderEvent (id/timestamp injectable so it
 *     is deterministic in tests and inside the order store).
 *   • logOperationalEvent(...) — emits a structured `[ops]` line to the console (picked up
 *     by the platform log drain) AND returns the built event. Safe to call from anywhere;
 *     it never throws and has no user-visible effect.
 *
 * The production system of record for these events is the backend `audit_log`
 * (services/audit.js). This module is the frontend/edge counterpart so checkout, payment,
 * render, and fulfillment milestones are observable without touching unrelated code.
 */

import type { OrderEvent, OrderEventScope } from './types';

let seq = 0;

export interface MakeEventInput {
  orderId: string;
  scope: OrderEventScope;
  message: string;
  actor?: string;
  metadata?: Record<string, unknown>;
}

export interface MakeEventOptions {
  /** Inject a fixed timestamp (ISO) for determinism; defaults to now. */
  at?: string;
  /** Inject a fixed id for determinism; defaults to a monotonic local id. */
  id?: string;
}

export function makeOrderEvent(input: MakeEventInput, opts: MakeEventOptions = {}): OrderEvent {
  return {
    id: opts.id ?? `evt_${(seq = (seq + 1) % Number.MAX_SAFE_INTEGER)}`,
    orderId: input.orderId,
    scope: input.scope,
    at: opts.at ?? new Date().toISOString(),
    message: input.message,
    actor: input.actor ?? 'system',
    metadata: input.metadata,
  };
}

export type OpsLevel = 'info' | 'warn' | 'error';

/**
 * Emit an operational event to the log drain and return the structured event.
 * Never throws — logging must not break the flow it observes.
 */
export function logOperationalEvent(
  input: MakeEventInput,
  level: OpsLevel = 'info',
  opts: MakeEventOptions = {},
): OrderEvent {
  const event = makeOrderEvent(input, opts);
  try {
    const line = { tag: 'ops', level, ...event };
    // eslint-disable-next-line no-console
    (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(
      '[ops]',
      JSON.stringify(line),
    );
  } catch {
    /* logging must never throw */
  }
  return event;
}
