import Link from 'next/link';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { CollectionHero } from '@/components/collection/collection-hero';
import { FaqAccordion } from '@/components/collection/faq-accordion';
import { ProductGrid } from '@/components/storefront/product-grid';
import { CollectionGrid } from '@/components/storefront/collection-grid';
import { ShopFilter } from '@/components/storefront/shop-filter';
import { TrustSection } from '@/components/storefront/trust-section';
import { JsonLd } from '@/components/storefront/json-ld';
import {
  getAllCollections,
  getAllOccasions,
  getAllProducts,
  getAllSports,
  getFeaturedProducts,
} from '@/lib/catalog/products';
import { poster } from '@/lib/catalog/poster';
import { buildMetadata, SITE } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Shop Custom Banners, Posters & Social Graphics',
  description:
    'Browse custom banners, posters, yard signs, and social graphics for teams, graduation, and championships. Start a free design proof — no payment required.',
  path: '/shop',
});

const SHOP_FAQ = [
  { q: 'Do I have to pay to see my design?', a: 'No. Choose a product, personalize it, and preview your free design proof. You only pay when you approve it.' },
  { q: 'Can I get printed and digital?', a: 'Many products offer printed, digital, or both. The available options are shown for each product during customization.' },
  { q: 'Can I use my own photos and colors?', a: 'Yes — every product is personalized with your photos, colors, and text.' },
  { q: 'Which product should I choose?', a: 'Pick the one closest to your celebration. You can adjust details during the free proof, so it’s easy to change your mind.' },
];

export default function ShopPage() {
  const featured = getFeaturedProducts();
  const collections = getAllCollections();
  const products = getAllProducts();

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'CelebrateBanner products',
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE.url}/products/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <>
      <JsonLd id="ld-shop" data={itemList} />

      <CollectionHero
        title="Custom Banners, Posters & Social Graphics"
        subtitle="Choose a product, upload your photos, review your free design proof, and order only when you are ready."
        backgroundImage={poster('SHOP', 'Made for your celebration', '16x9')}
        primaryCTA={{ href: '/proof', label: 'Start Free Design Proof' }}
        secondaryCTA={{ href: '#all-products', label: 'Browse all products' }}
      />

      {/* Featured */}
      <Section background="ivory" spacing="lg" aria-labelledby="featured-heading">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">Featured</p>
            <h2 id="featured-heading" className="mt-2 font-display text-3xl font-semibold text-obsidian sm:text-4xl">
              Popular right now
            </h2>
          </div>
        </div>
        <ProductGrid products={featured} />
      </Section>

      {/* Shop by collection */}
      <Section background="ivory-dim" spacing="lg" aria-labelledby="collections-heading">
        <div className="mb-8 text-center">
          <h2 id="collections-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            Shop by collection
          </h2>
        </div>
        <CollectionGrid collections={collections} />
      </Section>

      {/* Browse + all products */}
      <Section background="ivory" spacing="lg" id="all-products" aria-labelledby="all-heading">
        <div className="mb-8">
          <h2 id="all-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            All products
          </h2>
          <p className="mt-2 text-obsidian/60">Filter by occasion or sport, or search by name.</p>
        </div>
        <ShopFilter products={products} occasions={getAllOccasions()} sports={getAllSports()} />
      </Section>

      <TrustSection />

      {/* FAQ */}
      <Section background="ivory" spacing="lg" aria-labelledby="shop-faq-heading">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 id="shop-faq-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <FaqAccordion items={SHOP_FAQ} />
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
