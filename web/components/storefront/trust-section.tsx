import { Section } from '@/components/ui/section';
import { TrustGrid } from '@/components/collection/trust-grid';

/** Factual trust indicators only — no fabricated reviews, ratings, or guarantees. */
const TRUST_FEATURES = [
  { icon: '✓', title: 'Free Design Proof', description: 'See your personalized design before you pay — no payment required to preview.' },
  { icon: '✓', title: 'Personalized Design', description: 'Every design is built from your own photos, colors, and text.' },
  { icon: '✓', title: 'Secure Checkout', description: 'Payments are processed securely through Stripe when you’re ready.' },
  { icon: '✓', title: 'Printed & Digital Options', description: 'Choose printed, digital, or both — where the product supports it.' },
  { icon: '✓', title: 'Friendly Customer Support', description: 'Questions before you order? Reach us at info@celebratebanner.com.' },
];

export function TrustSection({
  background = 'ivory-dim',
  heading = 'Why customers choose CelebrateBanner',
}: {
  background?: 'ivory' | 'ivory-dim';
  heading?: string;
}) {
  return (
    <Section background={background} spacing="lg" aria-labelledby="trust-heading">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 id="trust-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
          {heading}
        </h2>
      </div>
      <TrustGrid features={TRUST_FEATURES} />
    </Section>
  );
}
