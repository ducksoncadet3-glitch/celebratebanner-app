import Script from 'next/script';
import Link from 'next/link';
import { buildMetadata, SITE } from '@/lib/seo';
import { footballCollection as data } from '@/lib/collections/football';

import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { CollectionHero } from '@/components/collection/collection-hero';
import { ProductCard } from '@/components/product/product-card';
import { PackageCard } from '@/components/product/package-card';
import { TrustGrid } from '@/components/collection/trust-grid';
import { ProcessSteps } from '@/components/collection/process-steps';
import { FaqAccordion } from '@/components/collection/faq-accordion';

export const metadata = buildMetadata(data.seo);

/** JSON-LD: CollectionPage listing the products, plus an FAQPage for the FAQ block. */
function jsonLd() {
  const url = `${SITE.url}${data.seo.path}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': url,
        url,
        name: `${data.seo.title} · ${SITE.name}`,
        description: data.seo.description,
        isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
        hasPart: {
          '@type': 'ItemList',
          itemListElement: data.products.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Product',
              name: p.title,
              description: p.description,
              category: 'Football / Team Recognition',
            },
          })),
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: data.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}

export default function FootballCollectionPage() {
  return (
    <>
      <AnnouncementBar />

      <CollectionHero
        title={data.hero.title}
        subtitle={data.hero.subtitle}
        backgroundImage={data.hero.backgroundImage}
        primaryCTA={data.hero.primaryCTA}
        secondaryCTA={data.hero.secondaryCTA}
      />

      {/* Products */}
      <Section background="ivory" spacing="lg" aria-labelledby="products-heading">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">{data.intro.eyebrow}</p>
          <h2 id="products-heading" className="mt-3 font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            {data.intro.heading}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-obsidian/60">{data.intro.body}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.products.map((p) => (
            <ProductCard
              key={p.id}
              image={p.image}
              imageAlt={p.imageAlt}
              title={p.title}
              description={p.description}
              href={p.href}
              price={`Available as: ${p.format} · multiple sizes and formats.`}
              badge={p.badge}
              buttonText="Start Designing"
            />
          ))}
        </div>
      </Section>

      {/* Packages */}
      <Section id="packages" background="ivory-dim" spacing="lg" aria-labelledby="packages-heading">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 id="packages-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            Season packages
          </h2>
          <p className="mt-4 text-base leading-relaxed text-obsidian/60">
            Bundle the essentials for your program — preview every design for free before you order.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {data.packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              name={pkg.name}
              tagline={pkg.tagline}
              note={pkg.note}
              features={pkg.features}
              href={pkg.href}
              ctaLabel={pkg.ctaLabel}
              popular={pkg.popular}
            />
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section background="ivory" spacing="lg" aria-labelledby="process-heading">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 id="process-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-base leading-relaxed text-obsidian/60">
            From photos to a finished design in minutes — no payment required to preview.
          </p>
        </div>
        <ProcessSteps steps={data.process} />
      </Section>

      {/* Trust */}
      <Section background="ivory-dim" spacing="lg" aria-labelledby="trust-heading">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 id="trust-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            Why teams choose CelebrateBanner
          </h2>
        </div>
        <TrustGrid features={data.trust} />
      </Section>

      {/* FAQ */}
      <Section background="ivory" spacing="lg" aria-labelledby="faq-heading">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 id="faq-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <FaqAccordion items={data.faqs} />
      </Section>

      {/* Final CTA */}
      <Section background="obsidian" spacing="lg" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="cta-heading" className="font-display text-3xl font-semibold text-ivory sm:text-4xl">
            {data.finalCta.heading}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ivory/75">{data.finalCta.body}</p>
          <div className="mt-8 flex justify-center">
            <Button asChild variant="gold" size="lg">
              <Link href={data.finalCta.cta.href}>{data.finalCta.cta.label}</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Script
        id="ld-football-collection"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
      />
    </>
  );
}
