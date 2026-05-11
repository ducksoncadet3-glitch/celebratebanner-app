import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { GalleryGrid } from '@/components/gallery-grid';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Gallery — Real banners by real customers',
  description:
    'Browse celebration banners built by graduates, couples, families, and teams using CelebrateBanner.',
  path: '/gallery',
});

export default function GalleryPage() {
  return (
    <>
      <section className="bg-ivory py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-dark">
              Gallery
            </p>
            <h1 className="mt-4 text-balance text-4xl sm:text-5xl">
              Banners our customers have made
            </h1>
            <p className="mt-4 text-pretty text-obsidian/70">
              Real banners from graduations, weddings, championship runs, and family milestones.
              Every one started as a stack of phone photos.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          <GalleryGrid />
        </Container>
      </section>

      <section className="bg-obsidian py-16 text-ivory sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl text-ivory sm:text-4xl">
              Your banner could be here next
            </h2>
            <p className="mt-3 text-ivory/70">
              Free to design. You only pay when you&apos;re ready to download or print.
            </p>
            <div className="mt-7">
              <Button asChild size="lg">
                <Link href="/create">Start designing</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
