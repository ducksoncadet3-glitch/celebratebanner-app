'use client';

import { useState, type ReactNode } from 'react';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { api, ApiError } from '@/lib/api';
import { getStoredEmail, newProjectId, setStoredEmail } from '@/lib/utils';
import type { ProductId, RenderType } from '@/lib/pricing';

interface Props {
  productId: ProductId;
  addVideo?: boolean;
  projectId?: string;
  templateId?: string;
  renderType?: RenderType;
  variant?: 'primary' | 'gold' | 'secondary';
  className?: string;
  children: ReactNode;
}

const LEGACY_LINK = process.env.NEXT_PUBLIC_LEGACY_STRIPE_LINK ?? '';

export function CheckoutButton({
  productId,
  addVideo = false,
  projectId,
  templateId = 'graduation',
  renderType = 'standard',
  variant = 'primary',
  className,
  children,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setError(null);
    setLoading(true);
    try {
      const email =
        (getStoredEmail() || prompt('Email address for your banner delivery?') || '').trim();
      if (!email) {
        setLoading(false);
        return;
      }
      setStoredEmail(email);

      const items: { productId: ProductId }[] = [{ productId }];
      if (addVideo && productId !== 'video') items.push({ productId: 'video' });

      const { url } = await api.createCheckout({
        projectId: projectId ?? newProjectId(),
        templateId,
        renderType,
        customerEmail: email,
        items,
      });
      window.location.assign(url);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not start checkout';
      setError(msg);
      // Legacy fallback while migration is in flight: if the API is unreachable,
      // send the user to the static Stripe payment link so they can still pay.
      if (LEGACY_LINK && err instanceof ApiError && err.status >= 500) {
        window.location.assign(LEGACY_LINK);
        return;
      }
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        size="md"
        onClick={go}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Spinner className="h-4 w-4 border-obsidian/30 border-t-obsidian" /> Redirecting…
          </>
        ) : (
          children
        )}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-xs text-rose">
          {error}
        </p>
      )}
    </div>
  );
}
