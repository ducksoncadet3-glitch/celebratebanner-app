import { Section } from '@/components/ui/section';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { ProofWizard } from '@/components/proof/proof-wizard';
import { resolveProductId } from '@/lib/proof/options';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Free Design Proof',
  description:
    'Request a free design proof for your team banner, poster, or social graphic. Choose a product, share your details, and preview your design before you order — no payment required.',
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
            Free Design Proof
          </p>
          <h1 id="proof-page-title" className="mt-3 font-display text-4xl font-semibold text-obsidian sm:text-5xl">
            See your design before you order
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-obsidian/60">
            Answer a few quick questions and we&apos;ll prepare a free proof — no payment required to
            preview. It only takes a minute.
          </p>
        </header>

        <ProofWizard initialProductId={initialProductId} />
      </Section>
    </>
  );
}
