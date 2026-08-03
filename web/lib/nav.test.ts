import { describe, expect, it } from 'vitest';
import { NAV_INTERNAL_HREFS, SHOP_LINKS } from './nav';
import { getAllCollections, getAllProducts, getCollectionBySlug, getProductBySlug } from './catalog/products';

/**
 * Static app routes that exist as files under app/. Dynamic routes are resolved against the
 * catalog (mirroring generateStaticParams): /shop/<collection> and /products/<slug>.
 */
const STATIC_ROUTES = new Set([
  '/',
  '/shop',
  '/proof',
  '/create',
  '/pricing',
  '/gallery',
  '/checkout',
  '/success',
  '/cancel',
  '/football',
  '/admin/orders',
]);

/** Resolve an internal href to a real route (strips hash, matches dynamic segments). */
function routeExists(href: string): boolean {
  const path = href.split('#')[0].split('?')[0] || '/';
  if (STATIC_ROUTES.has(path)) return true;
  const shopMatch = path.match(/^\/shop\/([^/]+)$/);
  if (shopMatch) return Boolean(getCollectionBySlug(shopMatch[1]));
  const productMatch = path.match(/^\/products\/([^/]+)$/);
  if (productMatch) return Boolean(getProductBySlug(productMatch[1]));
  return false;
}

describe('navigation links', () => {
  it('every internal nav href resolves to a real route (no broken links)', () => {
    for (const href of NAV_INTERNAL_HREFS) {
      expect(routeExists(href), `nav href ${href}`).toBe(true);
    }
  });

  it('the Shop dropdown links to /shop and every collection', () => {
    const hrefs = SHOP_LINKS.map((l) => l.href);
    expect(hrefs).toContain('/shop');
    for (const c of getAllCollections()) {
      expect(hrefs, `collection ${c.slug} in shop menu`).toContain(`/shop/${c.slug}`);
    }
  });
});

describe('required storefront routes are backed by data', () => {
  it('every collection has a /shop/<slug> target', () => {
    for (const c of getAllCollections()) {
      expect(routeExists(`/shop/${c.slug}`)).toBe(true);
    }
  });

  it('every one of the 24 products has a /products/<slug> target', () => {
    const products = getAllProducts();
    expect(products).toHaveLength(24);
    for (const p of products) {
      expect(routeExists(`/products/${p.slug}`), `product route ${p.slug}`).toBe(true);
    }
  });

  it('the core storefront journey routes all resolve', () => {
    for (const href of ['/', '/shop', '/products/team-banner', '/proof']) {
      expect(routeExists(href)).toBe(true);
    }
  });
});
