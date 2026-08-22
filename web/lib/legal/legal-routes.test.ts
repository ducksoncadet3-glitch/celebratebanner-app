import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Launch guard for the Terms/Privacy/Returns/Shipping migration: the active app must serve
 * all four first-party legal pages, every customer-facing legal link must resolve internally
 * (never to the legacy marketing host that 404s after the Fly/domain cutover), and the
 * migrated copy must not reintroduce stale vendors in the RENDERED text.
 */

const WEB = process.cwd(); // vitest runs from web/
const read = (rel: string) => readFileSync(path.join(WEB, rel), 'utf8');
// Strip block + line comments so the reconciliation docstrings (which name the old vendors)
// don't create false positives when we assert the RENDERED copy is vendor-accurate.
const rendered = (rel: string) =>
  read(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const PAGES: Record<string, string> = {
  'app/terms/page.tsx': 'Governing Law',
  'app/privacy/page.tsx': 'Data Retention',
  'app/returns/page.tsx': 'Cancellation',
  'app/shipping/page.tsx': 'Carriers',
};

describe('all four legal routes exist as first-party pages', () => {
  it('each page is present, exports a default, and carries substantive content + contact', () => {
    for (const [rel, anchor] of Object.entries(PAGES)) {
      expect(existsSync(path.join(WEB, rel)), `${rel} must exist`).toBe(true);
      const src = read(rel);
      expect(src).toContain('export default');
      expect(src, `${rel} should show the business contact`).toContain('West Palm Beach, FL 33401');
      expect(src, `${rel} should contain "${anchor}"`).toContain(anchor);
    }
  });

  it('the shared legal contact renders the support email', () => {
    expect(read('components/legal/legal-page.tsx')).toContain('info@celebratebanner.com');
  });
});

describe('migrated copy is vendor-accurate (no stale processors in rendered text)', () => {
  // Print-fulfillment partner is not finalized — Printmoz/B2Sign were removed and no
  // replacement invented, so they must not appear in the rendered sub-processor table.
  const STALE = ['Cloudinary', 'SendGrid', 'Resend', 'Vercel', 'Railway', 'Cloudflare', 'Printmoz', 'B2Sign'];
  it('no legal page renders a stale vendor name', () => {
    for (const rel of Object.keys(PAGES)) {
      const body = rendered(rel);
      for (const vendor of STALE) {
        expect(body.includes(vendor), `${rel} renders stale vendor "${vendor}"`).toBe(false);
      }
    }
  });

  it('the privacy page names the verified production processors', () => {
    const body = rendered('app/privacy/page.tsx');
    for (const vendor of ['Amazon Web Services', 'CloudFront', 'Fly.io', 'Postmark', 'Stripe', 'Neon', 'Upstash']) {
      expect(body.includes(vendor), `privacy must name "${vendor}"`).toBe(true);
    }
  });
});

describe('legal links resolve internally', () => {
  it('the footer points all four policies at internal routes, not the marketing host', () => {
    const footer = read('components/footer.tsx');
    for (const href of ['/terms', '/privacy', '/returns', '/shipping']) {
      expect(footer).toContain(`href: '${href}'`);
    }
    expect(footer).not.toMatch(/celebratebanner\.com\/(terms|privacy|returns|shipping)/);
  });

  it('checkout links its terms/privacy references to the internal routes', () => {
    const checkout = read('components/checkout/order-review.tsx');
    expect(checkout).toContain('href="/terms"');
    expect(checkout).toContain('href="/privacy"');
  });
});
