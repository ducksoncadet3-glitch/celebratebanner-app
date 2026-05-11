import { Suspense } from 'react';
import { SuccessView } from '@/components/success-view';
import { Container } from '@/components/ui/container';
import { Spinner } from '@/components/ui/spinner';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Order complete',
  description: 'Your CelebrateBanner order is being processed. Download links coming up.',
  path: '/success',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default function SuccessPage() {
  return (
    <div className="bg-ivory py-16 sm:py-24">
      <Container>
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-3 py-20">
              <Spinner />
              <p className="text-sm text-obsidian/70">Confirming your payment…</p>
            </div>
          }
        >
          <SuccessView />
        </Suspense>
      </Container>
    </div>
  );
}
