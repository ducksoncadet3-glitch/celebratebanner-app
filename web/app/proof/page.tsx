import { Section } from '@/components/ui/section';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { ProofWizard } from '@/components/proof/proof-wizard';
import { resolveProductId } from '@/lib/proof/options';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Create Your Free Preview',
  description:
    'Set up your team banner, poster, or social graphic, then see your personalized design in the builder before you pay. No payment required to create your preview.',
  path: '/proof',
});

/** Optional deep-link preselection: /proof?product=<slug>. Unknown slugs are ignored
 * (fall back to no preselection), so the entry point can never be broken by a bad param. */
export default async function ProofPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string | string[] }>;
}) {
  const { product } = await searchParams;
  const initialProductId = resolveProductId(product);

  return (
    <>
      <AnnouncementBar />
      <Section background="ivory" spacing="lg" width="narrow" aria-labelledby="proof-page-title">
        <header className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
            Free Preview
          </p>
          <h1 id="proof-page-title" className="mt-3 font-display text-4xl font-semibold text-obsidian sm:text-5xl">
            See your design before you pay
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-obsidian/60">
            Answer a few quick questions to set up your design, then continue into the builder to add
            photos and see your live preview. No payment required to create your preview.
          </p>
        </header>

        <ProofWizard initialProductId={initialProductId} />
      </Section>
    </>
  );
}
