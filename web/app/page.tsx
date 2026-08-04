import Link from 'next/link';
import { Hero } from '@/components/hero';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { FaqAccordion } from '@/components/collection/faq-accordion';
import { ProductGrid } from '@/components/storefront/product-grid';
import { CollectionGrid } from '@/components/storefront/collection-grid';
import { TrustBar } from '@/components/storefront/trust-bar';
import { PerfectFor } from '@/components/storefront/perfect-for';
import { BundleCard } from '@/components/storefront/bundle-card';
import { TrustSection } from '@/components/storefront/trust-section';
import { getAllCollections, getFeaturedProducts } from '@/lib/catalog/products';
import { getAllBundles } from '@/lib/catalog/bundles';
import { thumbnailOverrides } from '@/lib/catalog/resolve-thumbnails';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Custom Banners, Posters & Graphics for Your Celebration',
  description:
    'Custom banners, posters, and social graphics for teams, graduations, and championships. Upload your photos, get a free design proof, and order only when you love it.',
  path: '/',
});

const VALUE_PROPS = [
  { title: 'Free proof first', body: 'See your personalized design before you pay. No payment required to preview.' },
  { title: 'Your photos & colors', body: 'Every design is built from your own photos, team colors, and text.' },
  { title: 'Printed & digital', body: 'Choose a printed keepsake, a digital file, or both — where the product supports it.' },
];

const STEPS = [
  { n: '01', title: 'Choose a product', body: 'Banners, posters, yard signs, or social graphics for your celebration.' },
  { n: '02', title: 'Upload your photos', body: 'Add your photos, colors, and details — we lay it out for you.' },
  { n: '03', title: 'Review your free proof', body: 'Preview your personalized design and order only when you love it.' },
];

const HOME_FAQ = [
  { q: 'Do I pay before I see my design?', a: 'No. Start a free design proof, personalize it, and preview your design. You only pay when you approve it.' },
  { q: 'Can I use my own photos and colors?', a: 'Yes — every product is personalized with your photos, colors, and text.' },
  { q: 'Do you offer printed and digital?', a: 'Many products offer printed, digital, or both. The available options are shown during customization.' },
];

export default function HomePage() {
  const featured = getFeaturedProducts();
  const collections = getAllCollections();
  const bundles = getAllBundles();
  const featuredOverrides = thumbnailOverrides(featured);

  return (
    <>
      <Hero />

      {/* Above-the-fold factual reassurance + catalog-derived price anchor */}
      <TrustBar />

      {/* Featured products */}
      <Section background="ivory" spacing="lg" aria-labelledby="home-featured-heading">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">Featured</p>
          <h2 id="home-featured-heading" className="mt-2 text-balance font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            Popular products
          </h2>
        </div>
        <ProductGrid products={featured} imageOverrides={featuredOverrides} />
        <div className="mt-10 text-center">
          <Button asChild size="lg" variant="secondary">
            <Link href="/shop">Shop all products</Link>
          </Button>
        </div>
      </Section>

      {/* Perfect For */}
      <PerfectFor />

      {/* Featured bundles */}
      <Section background="ivory-dim" spacing="lg" aria-labelledby="home-bundles-heading">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">Featured bundles</p>
          <h2 id="home-bundles-heading" className="mt-2 text-balance font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            Save a step with a ready-made package
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-obsidian/60">
            Everything for the moment in one place — build the whole package from a single free proof.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {bundles.map((b) => (
            <BundleCard key={b.slug} bundle={b} />
          ))}
        </div>
      </Section>

      {/* Shop by collection */}
      <Section background="ivory" spacing="lg" aria-labelledby="home-collections-heading">
        <div className="mb-8 text-center">
          <h2 id="home-collections-heading" className="text-balance font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            Shop by collection
          </h2>
        </div>
        <CollectionGrid collections={collections} />
      </Section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 bg-white py-20 sm:py-24" aria-labelledby="how-heading">
        <Container>
          <div className="mb-12 text-center">
            <h2 id="how-heading" className="text-balance text-3xl sm:text-4xl">How it works</h2>
            <p className="mt-3 text-obsidian/70">From your photos to an approved proof — free to preview.</p>
          </div>
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="relative">
                <span className="font-display text-5xl text-gold/40">{s.n}</span>
                <h3 className="mt-2 text-xl">{s.title}</h3>
                <p className="mt-1 text-sm text-obsidian/70">{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 text-center">
            <Button asChild size="lg" variant="gold">
              <Link href="/proof">Start Free Design Proof</Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Why CelebrateBanner */}
      <section className="py-20 sm:py-24" aria-labelledby="why-heading">
        <Container>
          <div className="mb-12 text-center">
            <h2 id="why-heading" className="text-balance text-3xl sm:text-4xl">Why CelebrateBanner</h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-obsidian/70">
              A simple, honest way to turn your photos into a celebration piece you&apos;ll be proud of.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {VALUE_PROPS.map((v) => (
              <div key={v.title} className="rounded-2xl border border-gold/20 bg-white p-7 shadow-lift transition hover:-translate-y-1 hover:border-gold/40">
                <div className="gold-divider mb-5" />
                <h3 className="text-xl">{v.title}</h3>
                <p className="mt-2 text-sm text-obsidian/70">{v.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Customer confidence */}
      <Section background="obsidian" spacing="lg" aria-labelledby="confidence-heading">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="confidence-heading" className="font-display text-3xl font-semibold text-ivory sm:text-4xl">
            See Your Personalized Design Before You Pay
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ivory/75">
            Start with a free proof, review your personalized design, and place your order only when
            you are satisfied.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild variant="gold" size="lg">
              <Link href="/proof">Start Free Design Proof</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-ivory/55">No payment required to see your proof.</p>
        </div>
      </Section>

      {/* Trust */}
      <TrustSection background="ivory-dim" heading="Why customers trust CelebrateBanner" />

      {/* FAQ */}
      <Section background="ivory" spacing="lg" aria-labelledby="home-faq-heading">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 id="home-faq-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <FaqAccordion items={HOME_FAQ} />
      </Section>
    </>
  );
}
