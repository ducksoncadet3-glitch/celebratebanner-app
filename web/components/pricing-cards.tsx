'use client';

import { useState } from 'react';
import { PRICING, PRODUCT_ORDER, type ProductId } from '@/lib/pricing';
import { CheckoutButton } from './checkout-button';
import { cn } from '@/lib/utils';

const FEATURES: Record<ProductId, string[]> = {
  digital: [
    'Print-ready 300 DPI PDF + JPG',
    'Bleed + safe margins included',
    'Send to any local print shop',
    'Instant download after payment',
  ],
  print: [
    'Professionally printed 24×36"',
    'Premium vinyl, brass grommets',
    'Free shipping in 3–5 business days',
    'Digital files also included',
  ],
  video: [
    '60-second cinematic slideshow',
    'Music + motion + transitions',
    'Vertical and horizontal versions',
    'Perfect for Instagram + TikTok',
  ],
};

export function PricingCards({ projectId, templateId }: { projectId?: string; templateId?: string }) {
  const [video, setVideo] = useState(false);

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-3">
        {PRODUCT_ORDER.filter((id) => id !== 'video').map((id) => {
          const p = PRICING[id];
          return (
            <article
              key={p.id}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-white p-7 transition',
                p.featured
                  ? 'border-gold shadow-gold ring-1 ring-gold/30'
                  : 'border-gold/20 hover:border-gold/40',
              )}
            >
              {p.badge && (
                <span className="absolute -top-3 left-7 rounded-full bg-obsidian px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                  {p.badge}
                </span>
              )}
              <h3 className="text-2xl">{p.label}</h3>
              <p className="mt-1 text-sm text-obsidian/65">{p.tagline}</p>
              <p className="mt-5 font-display text-5xl">{p.displayPrice}</p>
              <p className="mt-1 text-xs text-obsidian/55">one-time, USD</p>
              <ul className="mt-6 space-y-2 text-sm text-obsidian/80">
                {FEATURES[p.id].map((f) => (
                  <li key={f} className="flex gap-2">
                    <span aria-hidden className="text-gold">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex-1" />
              <CheckoutButton
                productId={p.id}
                addVideo={video}
                projectId={projectId}
                templateId={templateId}
                variant={p.featured ? 'gold' : 'primary'}
                className="mt-2 w-full"
              >
                Get {p.label.toLowerCase()}
              </CheckoutButton>
            </article>
          );
        })}

        <article className="flex flex-col rounded-2xl border border-dashed border-gold/40 bg-ivory p-7">
          <h3 className="text-2xl">{PRICING.video.label}</h3>
          <p className="mt-1 text-sm text-obsidian/65">{PRICING.video.tagline}</p>
          <p className="mt-5 font-display text-5xl">{PRICING.video.displayPrice}</p>
          <p className="mt-1 text-xs text-obsidian/55">add-on, USD</p>
          <ul className="mt-6 space-y-2 text-sm text-obsidian/80">
            {FEATURES.video.map((f) => (
              <li key={f} className="flex gap-2">
                <span aria-hidden className="text-gold">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-gold/30 bg-white p-3 text-sm">
            <input
              type="checkbox"
              checked={video}
              onChange={(e) => setVideo(e.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            <span>Add a video slideshow to my order</span>
          </label>
          <p className="mt-3 text-xs text-obsidian/55">
            Video is added to whichever banner option you check out with above.
          </p>
        </article>
      </div>
    </div>
  );
}
