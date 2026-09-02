import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProcessSteps } from '@/components/collection/process-steps';
import { FaqAccordion } from '@/components/collection/faq-accordion';
import { Breadcrumbs } from '@/components/storefront/breadcrumbs';
import { PriceDisplay } from '@/components/storefront/price-display';
import { ProductGallery } from '@/components/storefront/product-gallery';
import { ProductFeatures } from '@/components/storefront/product-features';
import { ProductSpecifications } from '@/components/storefront/product-specifications';
import { RelatedProducts } from '@/components/storefront/related-products';
import { FrequentlyBoughtTogether } from '@/components/storefront/frequently-bought-together';
import { WhyChoose, RecommendedFor, CoachTip } from '@/components/storefront/product-merch';
import { TrustSection } from '@/components/storefront/trust-section';
import { JsonLd } from '@/components/storefront/json-ld';
import {
  deliveryLabel,
  getAllProducts,
  getCollectionBySlug,
  getProductBySlug,
} from '@/lib/catalog/products';
import { productOffer } from '@/lib/catalog/structured-data';
import { proofHrefForProduct } from '@/lib/catalog/proof-link';
import { isComingSoon, isReadyMade, COMING_SOON_LABEL, COMING_SOON_NOTE } from '@/lib/catalog/availability';
import { CheckoutButton } from '@/components/checkout-button';
import { getProductBySlug as lookupProduct } from '@/lib/catalog/products';
import { resolveProductImage } from '@/lib/catalog/product-image';
import { buildMetadata, SITE } from '@/lib/seo';

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProductBySlug(slug);
  if (!p) return buildMetadata({ title: 'Product', description: 'Shop CelebrateBanner.', path: '/shop', noIndex: true });
  return buildMetadata({ title: p.seoTitle, description: p.seoDescription, path: `/products/${p.slug}` });
}

const HOW_IT_WORKS = [
  { title: 'Choose this product', description: 'Start from a layout built for your celebration.' },
  { title: 'Upload your photos', description: 'Add your photos, colors, and details.' },
  { title: 'Personalize', description: 'Enter names, text, and any specifics.' },
  { title: 'See your free preview', description: 'See your personalized design — free, before you order.' },
  { title: 'Order when ready', description: 'Choose your options and check out only when you love it.' },
];

function formatsFor(delivery: 'printed' | 'digital' | 'both'): string[] {
  if (delivery === 'both') return ['Printed', 'Digital'];
  if (delivery === 'printed') return ['Printed'];
  return ['Digital'];
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const collection = getCollectionBySlug(product.collectionSlug);
  const proofHref = proofHrefForProduct(product);
  const comingSoon = isComingSoon(product);
  // Ready-made checkout renders only when the product is actually purchasable.
  const readyMade = isReadyMade(product) && !comingSoon;
  const crossSell = product.crossSellSlug ? lookupProduct(product.crossSellSlug) : undefined;
  const url = `${SITE.url}/products/${product.slug}`;

  // Approved flagship hero if present, else the catalog placeholder (never broken).
  const hero = resolveProductImage(product.slug, 'hero');
  const heroAlt = hero.isPlaceholder ? `${product.name} — sample design (placeholder)` : hero.alt;

  // Product + Breadcrumb structured data. No rating/review schema (nothing to substantiate).
  // `image` intentionally omitted while assets are placeholders (see lib/catalog/poster.ts).
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    category: product.category,
    brand: { '@type': 'Brand', name: SITE.name },
    offers: { ...productOffer(product), url },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE.url}/shop` },
      { '@type': 'ListItem', position: 3, name: collection?.name ?? 'Products', item: `${SITE.url}/shop/${product.collectionSlug}` },
      { '@type': 'ListItem', position: 4, name: product.name, item: url },
    ],
  };

  return (
    <>
      <JsonLd id={`ld-product-${product.slug}`} data={productLd} />
      <JsonLd id={`ld-breadcrumb-${product.slug}`} data={breadcrumbLd} />

      <Section background="ivory" spacing="md" container>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            { label: collection?.name ?? 'Products', href: `/shop/${product.collectionSlug}` },
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <ProductGallery images={[hero.src]} alt={heroAlt} />

          <div>
            {product.badge && <Badge variant="featured">{product.badge}</Badge>}
            <h1 className="mt-3 font-display text-4xl font-semibold text-obsidian sm:text-5xl">{product.name}</h1>
            {comingSoon ? (
              <p className="mt-3 text-lg font-semibold text-obsidian/55">{COMING_SOON_LABEL}</p>
            ) : (
              <PriceDisplay label={product.priceLabel} size="lg" className="mt-3" />
            )}
            <p className="mt-4 text-lg leading-relaxed text-obsidian/70">{product.shortDescription}</p>
            <p className="mt-4 text-base leading-relaxed text-obsidian/60">{product.fullDescription}</p>

            <div className="mt-7">
              {readyMade ? (
                <>
                  {/* Ready-made: finished artwork, sold exactly as shown. Straight to the
                      certified checkout — no builder, no upload, nothing to render. */}
                  <CheckoutButton
                    productId="digital"
                    templateId={product.slug}
                    variant="gold"
                    className="w-full"
                  >
                    {product.ctaLabel ?? 'View & Buy'}
                  </CheckoutButton>
                  <p className="mt-3 text-center text-sm text-obsidian/60">
                    Instant secure download after payment. Printed edition coming soon.
                  </p>
                </>
              ) : comingSoon || !proofHref ? (
                <>
                  <Button variant="gold" size="lg" fullWidth disabled aria-disabled="true">
                    {COMING_SOON_LABEL}
                  </Button>
                  <p className="mt-3 text-center text-sm text-obsidian/60">{COMING_SOON_NOTE}</p>
                </>
              ) : (
                <>
                  <Button asChild variant="gold" size="lg" fullWidth>
                    <Link href={proofHref}>{product.ctaLabel ?? 'Create Your Free Preview'}</Link>
                  </Button>
                  <p className="mt-3 text-center text-sm text-obsidian/60">No payment required to see your preview.</p>
                </>
              )}
            </div>

            {crossSell && (
              <div className="mt-6 rounded-xl border border-gold/25 bg-gold/5 p-4">
                <p className="text-sm text-obsidian/80">
                  {readyMade
                    ? 'Want one made with your own photos?'
                    : 'Prefer a finished artwork?'}{' '}
                  <Link
                    href={`/products/${crossSell.slug}`}
                    className="font-semibold text-gold-dark underline underline-offset-2"
                  >
                    {readyMade
                      ? 'Create a World Memories Photo Collage'
                      : 'Discover The Beauty of the World'}
                  </Link>
                </p>
              </div>
            )}

            {/* Available formats */}
            <div className="mt-7 border-t border-obsidian/8 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-obsidian/55">Available formats</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {formatsFor(product.deliveryType).map((f) => (
                  <span key={f} className="rounded-full bg-obsidian/6 px-3 py-1 text-sm font-medium text-obsidian/75">
                    {f}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-sm text-obsidian/55">{deliveryLabel(product.deliveryType)}.</p>
            </div>

            {/* Recommended for */}
            <div className="mt-6">
              <RecommendedFor product={product} />
            </div>

            {/* Coach tip */}
            <div className="mt-6">
              <CoachTip product={product} />
            </div>
          </div>
        </div>
      </Section>

      {/* Features + why choose */}
      <Section background="ivory-dim" spacing="lg" aria-labelledby="features-heading">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 id="features-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">What’s included</h2>
            <div className="mt-6">
              <ProductFeatures features={product.features} />
            </div>
          </div>
          <WhyChoose product={product} />
        </div>
      </Section>

      {/* How it works */}
      <Section background="ivory" spacing="lg" aria-labelledby="how-heading">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 id="how-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">How it works</h2>
          <p className="mt-4 text-base leading-relaxed text-obsidian/60">From photos to a finished design — free to preview.</p>
        </div>
        <ProcessSteps steps={HOW_IT_WORKS} />
      </Section>

      {/* Specifications */}
      <Section background="ivory-dim" spacing="lg" aria-labelledby="specs-heading">
        <div className="mx-auto max-w-2xl">
          <h2 id="specs-heading" className="mb-6 font-display text-3xl font-semibold text-obsidian sm:text-4xl">Specifications</h2>
          <ProductSpecifications specifications={product.specifications} availableSizes={product.availableSizes} />
        </div>
      </Section>

      {/* FAQ */}
      <Section background="ivory" spacing="lg" aria-labelledby="product-faq-heading">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 id="product-faq-heading" className="font-display text-3xl font-semibold text-obsidian sm:text-4xl">
            {product.name} — FAQ
          </h2>
        </div>
        <FaqAccordion items={product.faq} />
      </Section>

      {/* Frequently bought together */}
      <Section background="ivory" spacing="lg" aria-labelledby="fbt-heading">
        <h2 id="fbt-heading" className="sr-only">Frequently bought together</h2>
        <FrequentlyBoughtTogether product={product} />
      </Section>

      {/* Related */}
      <Section background="ivory-dim" spacing="lg" aria-labelledby="related-heading">
        <h2 id="related-heading" className="sr-only">Related products</h2>
        <RelatedProducts slug={product.slug} />
      </Section>

      <TrustSection background="ivory" />

      {/* Bottom CTA */}
      <Section background="obsidian" spacing="lg" aria-labelledby="product-cta-heading">
        <Card as="div" padding="none" className="border-0 bg-transparent shadow-none">
          <div className="mx-auto max-w-2xl text-center">
            {comingSoon || !proofHref ? (
              <>
                <h2 id="product-cta-heading" className="font-display text-3xl font-semibold text-ivory sm:text-4xl">
                  {product.name} is coming soon
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-ivory/75">{COMING_SOON_NOTE}</p>
                <div className="mt-8 flex justify-center">
                  <Button asChild variant="gold" size="lg">
                    <Link href="/shop">Browse designs you can create today</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 id="product-cta-heading" className="font-display text-3xl font-semibold text-ivory sm:text-4xl">
                  Ready to see your {product.name.toLowerCase()}?
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-ivory/75">
                  Create your free preview — no payment required to see your design.
                </p>
                <div className="mt-8 flex justify-center">
                  <Button asChild variant="gold" size="lg">
                    <Link href={proofHref}>{product.ctaLabel ?? 'Create Your Free Preview'}</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </Section>
    </>
  );
}
