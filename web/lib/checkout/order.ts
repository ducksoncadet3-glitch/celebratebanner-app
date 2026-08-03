/**
 * Pure checkout/order logic — no React, no browser globals. Parses the order intent from
 * URL params, validates contact + shipping, and builds the exact CreateCheckoutInput the
 * existing backend expects. Isolated here so the Order Review UI stays declarative and the
 * rules are unit-testable.
 *
 * The order RECORD itself is created server-side by the existing
 * `api.createCheckout` → POST /api/payments/checkout call (which also creates the Stripe
 * session). We never touch Stripe secrets or invent new backend endpoints.
 */

import { PRICING, totalCents, type ProductId, type RenderType } from '@/lib/pricing';
import type { CreateCheckoutInput, ShippingAddress } from '@/lib/api';

export interface OrderParams {
  productId: ProductId;
  projectId: string;
  templateId: string;
  renderType: RenderType;
  addVideo: boolean;
}

export interface ContactErrors {
  email?: string;
}

export interface ShippingErrors {
  name?: string;
  line1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export const EMPTY_SHIPPING: ShippingAddress = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
};

/** Loose but effective email check (matches the proof wizard's rule). */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isProductId(v: unknown): v is ProductId {
  return v === 'digital' || v === 'print' || v === 'video';
}

function isRenderType(v: unknown): v is RenderType {
  return v === 'standard' || v === 'premium';
}

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Parse `/checkout?product=&project=&template=&render=&video=` into a typed OrderParams,
 * or null if there's no valid product (the page then shows an "invalid order" fallback). */
export function parseOrderParams(
  sp: Record<string, string | string[] | undefined>,
): OrderParams | null {
  const product = first(sp.product);
  if (!isProductId(product)) return null;

  const renderRaw = first(sp.render);
  return {
    productId: product,
    projectId: first(sp.project) ?? '',
    templateId: first(sp.template) || 'graduation',
    renderType: isRenderType(renderRaw) ? renderRaw : 'standard',
    addVideo: first(sp.video) === '1',
  };
}

/** Whether the order's primary product needs a physical shipping address. */
export function requiresShipping(productId: ProductId): boolean {
  return PRICING[productId].metadata.requiresShipping;
}

/** All product ids in the order (primary + optional video add-on), de-duplicated. */
export function orderProductIds(params: OrderParams): ProductId[] {
  const ids: ProductId[] = [params.productId];
  if (params.addVideo && params.productId !== 'video') ids.push('video');
  return ids;
}

export function orderTotalCents(params: OrderParams): number {
  return totalCents(orderProductIds(params));
}

export function validateContact(email: string): ContactErrors {
  const errors: ContactErrors = {};
  if (!email.trim()) errors.email = 'An email is required for your receipt and delivery.';
  else if (!isEmail(email)) errors.email = 'Please enter a valid email address.';
  return errors;
}

export function validateShipping(addr: ShippingAddress): ShippingErrors {
  const errors: ShippingErrors = {};
  if (!addr.name.trim()) errors.name = 'Recipient name is required.';
  if (!addr.line1.trim()) errors.line1 = 'Street address is required.';
  if (!addr.city.trim()) errors.city = 'City is required.';
  if (!addr.state.trim()) errors.state = 'State / region is required.';
  if (!addr.postalCode.trim()) errors.postalCode = 'ZIP / postal code is required.';
  if (!addr.country.trim()) errors.country = 'Country is required.';
  return errors;
}

/** True when the whole order is ready to submit (contact always; shipping if required). */
export function isOrderValid(params: OrderParams, email: string, shipping: ShippingAddress): boolean {
  if (Object.keys(validateContact(email)).length > 0) return false;
  if (requiresShipping(params.productId) && Object.keys(validateShipping(shipping)).length > 0) {
    return false;
  }
  return true;
}

/**
 * Build the backend checkout payload. `projectId` must already be resolved (non-empty) by
 * the caller. Shipping is attached only for products that require it, keeping digital
 * orders identical to the pre-existing payload shape.
 */
export function buildCheckoutInput(
  params: OrderParams,
  contact: { email: string; name?: string },
  shipping: ShippingAddress | null,
): CreateCheckoutInput {
  const input: CreateCheckoutInput = {
    projectId: params.projectId,
    templateId: params.templateId,
    renderType: params.renderType,
    customerEmail: contact.email.trim(),
    items: orderProductIds(params).map((productId) => ({ productId })),
  };
  const name = contact.name?.trim();
  if (name) input.customerName = name;
  if (requiresShipping(params.productId) && shipping) {
    input.shipping = normalizeShipping(shipping);
  }
  return input;
}

function normalizeShipping(s: ShippingAddress): ShippingAddress {
  const out: ShippingAddress = {
    name: s.name.trim(),
    line1: s.line1.trim(),
    city: s.city.trim(),
    state: s.state.trim(),
    postalCode: s.postalCode.trim(),
    country: s.country.trim().toUpperCase(),
  };
  const line2 = s.line2?.trim();
  if (line2) out.line2 = line2;
  return out;
}
