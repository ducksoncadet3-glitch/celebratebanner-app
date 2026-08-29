import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { NAV_INTERNAL_HREFS, PROOF_CTA, SHOP_LINKS } from './nav';
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


/**
 * Launch guard for the "Start Free Proof" funnel.
 *
 * The customer-facing CTAs used to target https://app.celebratebanner.com/index.html —
 * correct when GitHub Pages served the repo root at that hostname (see the root CNAME),
 * and a hard 404 ever since the app moved to the Next.js deployment, where `index.html`
 * is neither a route nor a static asset (.dockerignore excludes *.html from the image).
 *
 * These tests fail if any CTA reverts to a static-html destination.
 */
const WEB_ROOT = process.cwd();          // vitest runs from web/
const REPO_ROOT = path.join(WEB_ROOT, '..');

function filesUnder(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const entry of readdirSync(d)) {
      if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
      const full = path.join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (exts.some((e) => entry.endsWith(e))) out.push(full);
    }
  };
  walk(dir);
  return out;
}

/**
 * Root marketing pages that link across to the app.
 *
 * TRACKED pages only. `home.html` is deliberately not in the repository, so listing it
 * here would make the suite fail on a fresh clone (ENOENT) while passing locally.
 */
const MARKETING_PAGES = ['graduation-signature.html'];

describe('Start Free Proof CTAs point at real application routes', () => {
  it('no file in the web app targets /index.html', () => {
    const sources = [
      ...filesUnder(path.join(WEB_ROOT, 'app'), ['.tsx', '.ts']),
      ...filesUnder(path.join(WEB_ROOT, 'components'), ['.tsx', '.ts']),
      ...filesUnder(path.join(WEB_ROOT, 'lib'), ['.tsx', '.ts']),
    ];
    for (const file of sources) {
      if (file.endsWith('nav.test.ts')) continue;   // this guard names the string on purpose
      const body = readFileSync(file, 'utf8');
      expect(body, `${path.relative(REPO_ROOT, file)} links to a static index.html`)
        .not.toContain('app.celebratebanner.com/index.html');
    }
  });

  it('no marketing page targets /index.html on the app domain', () => {
    for (const page of MARKETING_PAGES) {
      const body = readFileSync(path.join(REPO_ROOT, page), 'utf8');
      expect(body, `${page} links to a static index.html`)
        .not.toContain('app.celebratebanner.com/index.html');
      expect(body, `${page} has a relative index.html link`)
        .not.toMatch(/href="index\.html"/);
    }
  });

  it('every app-domain link on a marketing page resolves to a real route', () => {
    const seen: string[] = [];
    for (const page of MARKETING_PAGES) {
      const body = readFileSync(path.join(REPO_ROOT, page), 'utf8');
      for (const m of body.matchAll(/https:\/\/app\.celebratebanner\.com(\/[^"'\s]*)?/g)) {
        const route = m[1] ?? '/';
        seen.push(route);
        expect(routeExists(route), `${page} → ${route}`).toBe(true);
      }
    }
    expect(seen.length, 'marketing pages should still link into the app').toBeGreaterThan(0);
  });

  it('free-proof CTAs enter the proof funnel, never the builder or checkout directly', () => {
    for (const page of MARKETING_PAGES) {
      const body = readFileSync(path.join(REPO_ROOT, page), 'utf8');
      for (const m of body.matchAll(/<a href="(https:\/\/app\.celebratebanner\.com[^"]*)"[^>]*>([^<]*)<\/a>/g)) {
        const [, href, label] = m;
        if (!/proof/i.test(label)) continue;
        expect(href, `${page}: "${label.trim()}" must enter /proof`).toContain('/proof');
        expect(href, `${page}: "${label.trim()}" must not skip to checkout`).not.toContain('/checkout');
      }
    }
  });

  // NOTE: the "?product=<key> is a real catalog key" invariant is asserted directly against
  // the catalog in lib/catalog/catalog.test.ts ("produces /proof?product=<resolvable key> for
  // every product") and lib/catalog/bundles.test.ts. It previously duplicated that check by
  // scraping home.html, which is not tracked — the catalog tests cover it without that dependency.

  it('the "full builder" link uses the canonical /create route', () => {
    const body = readFileSync(path.join(REPO_ROOT, 'graduation-signature.html'), 'utf8');
    expect(body).toContain('https://app.celebratebanner.com/create');
  });

  it('the header CTA uses the canonical proof route', () => {
    const header = readFileSync(path.join(WEB_ROOT, 'components/layout/header.tsx'), 'utf8');
    expect(header).toContain('PROOF_CTA.href');
    expect(PROOF_CTA.href).toBe('/proof');
    for (const m of header.matchAll(/href: '(\/[^']*)'/g)) {
      expect(routeExists(m[1]), `header link ${m[1]}`).toBe(true);
    }
  });
});
