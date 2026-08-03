import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { OrderReview } from '@/components/checkout/order-review';
import { parseOrderParams } from '@/lib/checkout/order';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Review your order',
  description: 'Review your CelebrateBanner order and shipping details before secure payment.',
  path: '/checkout',
  noIndex: true,
});

// Reads query params (order intent) → dynamic by nature.
export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = parseOrderParams(sp);

  return (
    <div className="bg-ivory py-12 sm:py-16">
      <Container width="wide">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">
            Secure checkout
          </p>
          <h1 className="mt-2 text-balance text-4xl sm:text-5xl">Review your order</h1>
        </header>

        {params ? (
          <OrderReview params={params} />
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-gold/30 bg-white p-10 text-center shadow-lift">
            <h2 className="text-2xl">We couldn&apos;t find an order to review.</h2>
            <p className="mt-3 text-obsidian/70">
              Your design is still saved. Head back to the builder and choose a product to check out.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="gold">
                <Link href="/create">Return to my banner</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
