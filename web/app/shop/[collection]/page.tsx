import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { CollectionHero } from '@/components/collection/collection-hero';
import { FaqAccordion } from '@/components/collection/faq-accordion';
import { Breadcrumbs } from '@/components/storefront/breadcrumbs';
import { ProductGrid } from '@/components/storefront/product-grid';
import { CollectionGrid } from '@/components/storefront/collection-grid';
import { TrustSection } from '@/components/storefront/trust-section';
import { JsonLd } from '@/components/storefront/json-ld';
import {
  getAllCollections,
  getCollectionBySlug,
  getProductsByCollection,
} from '@/lib/catalog/products';
import { poster } from '@/lib/catalog/poster';
import { buildMetadata, SITE } from '@/lib/seo';

export function generateStaticParams() {
  return getAllCollections().map((c) => ({ collection: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const c = getCollectionBySlug(collection);
  if (!c) return buildMetadata({ title: 'Collection', description: 'Shop CelebrateBanner.', path: '/shop', noIndex: true });
  return buildMetadata({ title: c.seoTitle, description: c.seoDescription, path: `/shop/${c.slug}` });
}

const COLLECTION_FAQ = [
  { q: 'Do I pay before I see my design?', a: 'No. Start a free design proof, personalize it, and preview your design. You only pay when you approve it.' },
  { q: 'Can I order printed or digital?', a: 'Available options are shown for each product during customization — choose what fits your celebration.' },
  { q: 'Can I use my own photos?', a: 'Yes. Every product is personalized with your photos, colors, and text.' },
];

export default async function CollectionPage({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const c = getCollectionBySlug(collection);
  if (!c) notFound();

  const products = getProductsByCollection(c.slug);
  const others = getAllCollections().filter((x) => x.slug !== c.slug);

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${c.name} — CelebrateBanner`,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/products/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      <JsonLd id={`ld-collection-${c.slug}`} data={itemList} />

      <CollectionHero
        title={c.name}
        subtitle={c.description}
        backgroundImage={poster(c.heroLabel, c.tagline, '16x9')}
        primaryCTA={{ href: '/proof', label: 'Start Free Design Proof' }}
        secondaryCTA={{ href: '#products', label: 'Browse products' }}
      />

      <Section background="ivory" spacing="md" container>
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shop', href: '/shop' }, { label: c.name }]} />
      </Section>

      <Section background="ivory" spacing="md" id="products" aria-labelledby="collection-products-heading">
        <div className="mb-8">
          <h2 id="collection-products-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            {c.name}
          </h2>
          <p className="mt-2 text-obsidian/60">
            {products.length} {products.length === 1 ? 'product' : 'products'} · {c.tagline}
          </p>
        </div>
        <ProductGrid products={products} />
      </Section>

      <TrustSection background="ivory-dim" />

      <Section background="ivory" spacing="lg" aria-labelledby="collection-faq-heading">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 id="collection-faq-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <FaqAccordion items={COLLECTION_FAQ} />
      </Section>

      {/* Related collections */}
      <Section background="ivory-dim" spacing="lg" aria-labelledby="other-collections-heading">
        <div className="mb-8 text-center">
          <h2 id="other-collections-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            Explore other collections
          </h2>
        </div>
        <CollectionGrid collections={others} className="lg:grid-cols-3" />
        <div className="mt-10 text-center">
          <Button asChild variant="gold" size="lg">
            <Link href="/proof">Start Free Design Proof</Link>
          </Button>
          <p className="mt-3 text-sm text-obsidian/55">No payment required to see your proof.</p>
        </div>
      </Section>
    </>
  );
}
