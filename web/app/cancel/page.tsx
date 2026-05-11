import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Checkout canceled',
  description: 'Your banner is still saved. You can pick up where you left off.',
  path: '/cancel',
  noIndex: true,
});

export default function CancelPage() {
  return (
    <div className="bg-ivory py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-xl rounded-2xl border border-gold/30 bg-white p-10 text-center shadow-lift">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-dark">
            Checkout canceled
          </p>
          <h1 className="mt-3 text-balance text-3xl sm:text-4xl">
            No worries — your banner is saved.
          </h1>
          <p className="mt-4 text-pretty text-obsidian/70">
            Nothing was charged. You can pick up exactly where you left off and finish whenever
            you&apos;re ready.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/create">Return to my banner</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/pricing">See pricing again</Link>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
