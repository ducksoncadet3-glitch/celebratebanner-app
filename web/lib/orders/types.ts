/**
 * Order operations types.
 *
 * The order status vocabulary is a superset of the backend `projects.status`
 * (pending | paid | rendering | ready | failed | refunded) plus two operational
 * states the fulfillment workflow needs:
 *   • fulfilled — a printed order has shipped / a digital order was delivered
 *   • canceled  — an unpaid order was abandoned/voided before payment
 * Keeping them aligned means this admin queue can sit directly on top of the
 * backend data model without a translation layer.
 */

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'rendering'
  | 'ready'
  | 'fulfilled'
  | 'failed'
  | 'refunded'
  | 'canceled';

/** Operational event categories logged across the order's life. */
export type OrderEventScope =
  | 'checkout'
  | 'payment'
  | 'rendering'
  | 'fulfillment'
  | 'status_change'
  | 'note';

export interface OrderEvent {
  id: string;
  orderId: string;
  scope: OrderEventScope;
  /** ISO-8601 timestamp. */
  at: string;
  message: string;
  /** Who caused it: 'system' | 'webhook' | 'admin:<id>' | 'customer'. */
  actor: string;
  metadata?: Record<string, unknown>;
}

export interface OrderShipping {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  /** Same id as the builder projectId. */
  id: string;
  customerEmail: string;
  customerName?: string;
  templateId: string;
  productIds: string[];
  amountTotalCents: number;
  currency: string;
  status: OrderStatus;
  requiresShipping: boolean;
  shipping?: OrderShipping;
  createdAt: string;
  updatedAt: string;
  events: OrderEvent[];
}

/** Lightweight row projection for the queue table. */
export interface OrderSummary {
  id: string;
  customerEmail: string;
  templateId: string;
  productIds: string[];
  amountTotalCents: number;
  currency: string;
  status: OrderStatus;
  requiresShipping: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListQuery {
  /** Free-text search across id + email. */
  q?: string;
  /** Restrict to a single status. */
  status?: OrderStatus;
}
