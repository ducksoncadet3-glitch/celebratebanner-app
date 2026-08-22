'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/proof/field';
import { ShippingForm } from './shipping-form';
import { api, ApiError, type ShippingAddress } from '@/lib/api';
import { logOperationalEvent } from '@/lib/orders/events';
import { PRICING, formatUSD } from '@/lib/pricing';
import { getStoredEmail, newProjectId, setStoredEmail } from '@/lib/utils';
import {
  EMPTY_SHIPPING,
  buildCheckoutInput,
  orderProductIds,
  orderTotalCents,
  requiresShipping,
  validateContact,
  validateShipping,
  type ContactErrors,
  type OrderParams,
  type ShippingErrors,
} from '@/lib/checkout/order';

const LEGACY_LINK = process.env.NEXT_PUBLIC_LEGACY_STRIPE_LINK ?? '';

export interface OrderReviewProps {
  params: OrderParams;
}

/**
 * Order Review — the step between the builder and Stripe. Summarizes the order, collects
 * contact + (for print) shipping, then creates the order record and Stripe Checkout session
 * via the existing api.createCheckout and redirects to the hosted payment page.
 */
export function OrderReview({ params }: OrderReviewProps) {
  const needsShipping = requiresShipping(params.productId);
  const productIds = orderProductIds(params);
  const total = orderTotalCents(params);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [shipping, setShipping] = useState<ShippingAddress>(EMPTY_SHIPPING);
  const [contactErrors, setContactErrors] = useState<ContactErrors>({});
  const [shippingErrors, setShippingErrors] = useState<ShippingErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setEmail(getStoredEmail());
  }, []);

  function patchShipping(patch: Partial<ShippingAddress>) {
    setShipping((s) => ({ ...s, ...patch }));
    setShippingErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(patch)) delete next[k as keyof ShippingErrors];
      return next;
    });
  }

  async function submit() {
    setFormError(null);
    const cErrors = validateContact(email);
    const sErrors = needsShipping ? validateShipping(shipping) : {};
    setContactErrors(cErrors);
    setShippingErrors(sErrors);
    if (Object.keys(cErrors).length > 0 || Object.keys(sErrors).length > 0) return;

    setSubmitting(true);
    try {
      setStoredEmail(email.trim());
      const resolved: OrderParams = {
        ...params,
        projectId: params.projectId || newProjectId(),
      };
      logOperationalEvent({
        orderId: resolved.projectId,
        scope: 'checkout',
        message: 'Checkout submitted from Order Review',
        actor: 'customer',
        metadata: { productIds, totalCents: total, requiresShipping: needsShipping },
      });
      // Creates the order record + Stripe Checkout session server-side, then we redirect.
      const { url } = await api.createCheckout(
        buildCheckoutInput(resolved, { email, name }, needsShipping ? shipping : null),
      );
      window.location.assign(url);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not start payment. Please try again.';
      // Legacy fallback: if the API is down (5xx), fall back to the static Stripe link so
      // the customer can still pay — mirrors the existing CheckoutButton behavior.
      if (LEGACY_LINK && err instanceof ApiError && err.status >= 500) {
        window.location.assign(LEGACY_LINK);
        return;
      }
      setFormError(msg);
      setSubmitting(false);
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      {/* Left: contact + shipping */}
      <div className="order-2 space-y-6 lg:order-1">
        <Card as="section" padding="lg" aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="font-display text-2xl font-semibold text-obsidian">
            Contact
          </h2>
          <p className="mt-1 text-sm text-obsidian/60">
            We&apos;ll send your receipt and download links here.
          </p>
          <div className="mt-5 grid gap-5">
            <TextField
              label="Email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                setContactErrors({});
              }}
              required
              error={contactErrors.email}
              autoComplete="email"
              placeholder="you@example.com"
            />
            <TextField
              label="Name"
              value={name}
              onChange={setName}
              hint="Optional — helps us personalize your order."
              autoComplete="name"
            />
          </div>
        </Card>

        {needsShipping && (
          <Card as="section" padding="lg" aria-labelledby="shipping-heading">
            <h2 id="shipping-heading" className="font-display text-2xl font-semibold text-obsidian">
              Shipping address
            </h2>
            <p className="mt-1 text-sm text-obsidian/60">
              Your printed banner ships here in 3–5 business days.
            </p>
            <div className="mt-5">
              <ShippingForm value={shipping} onChange={patchShipping} errors={shippingErrors} />
            </div>
          </Card>
        )}
      </div>

      {/* Right: order summary */}
      <div className="order-1 lg:order-2">
        <Card as="aside" padding="lg" aria-labelledby="summary-heading" className="lg:sticky lg:top-6">
          <h2 id="summary-heading" className="font-display text-2xl font-semibold text-obsidian">
            Order summary
          </h2>
          <ul role="list" className="mt-5 space-y-3">
            {productIds.map((id) => (
              <li key={id} className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-obsidian">
                  {PRICING[id].label}
                  <span className="block text-xs text-obsidian/50">{PRICING[id].tagline}</span>
                </span>
                <span className="text-sm font-semibold text-obsidian">{formatUSD(PRICING[id].amountCents)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-baseline justify-between border-t border-obsidian/10 pt-4">
            <span className="text-sm font-medium text-obsidian/70">Total</span>
            <span className="font-display text-2xl font-semibold text-obsidian">{formatUSD(total)}</span>
          </div>

          <dl className="mt-5 space-y-1.5 text-xs text-obsidian/55">
            <div className="flex justify-between gap-4">
              <dt>Delivery</dt>
              <dd>{needsShipping ? 'Printed & shipped (3–5 business days)' : 'Instant digital download'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Output</dt>
              <dd>300 DPI · PDF + JPG</dd>
            </div>
          </dl>

          <div className="mt-6">
            <Button variant="gold" fullWidth onClick={submit} loading={submitting} type="button">
              {submitting ? 'Redirecting to payment…' : `Proceed to secure payment · ${formatUSD(total)}`}
            </Button>
          </div>
          {formError && (
            <p ref={errorRef} tabIndex={-1} role="alert" className="mt-3 text-sm font-medium text-rose focus-visible:outline-none">
              {formError}
            </p>
          )}
          <p className="mt-3 text-center text-[11px] leading-relaxed text-obsidian/50">
            Secure payment via Stripe. You are only charged after this step. By continuing you agree to
            our{' '}
            <Link href="/terms" className="underline underline-offset-2 hover:text-obsidian/70">terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-obsidian/70">privacy policy</Link>
            .
          </p>
          <p className="mt-4 text-center text-xs">
            <Link href="/create" className="text-gold-dark underline-offset-2 hover:underline">
              ← Back to editing
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
