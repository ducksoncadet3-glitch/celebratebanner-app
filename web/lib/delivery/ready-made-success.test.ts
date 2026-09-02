import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The ready-made success page must be a real delivery surface.
 *
 * A ready-made order renders nothing, so the page it lands on must not narrate rendering,
 * and it must hand the customer their artwork rather than pointing at an email that may or
 * may not arrive. These are source-level guarantees: the suite runs in a node environment
 * with no DOM, and this wiring is exactly what regressed unnoticed before.
 */

const WEB = process.cwd();
const read = (p: string) => readFileSync(path.join(WEB, p), 'utf8');
/** Assert against CODE, not the prose documenting it. */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\/.*$/gm, '');

const PANEL = read('components/success/ready-made-delivery.tsx');
const VIEW = read('components/success-view.tsx');
const API = read('lib/api.ts');
const PROCESSING = read('components/processing-status.tsx');

const RENDER_NARRATIVE = [
  'Your banner is rendering now',
  'Preparing your photos',
  'Composing the banner',
  'Rendering at 300 DPI',
  'Your banner is ready',
];

describe('ready-made mode detection', () => {
  it('the success view branches on the product mode the server reports', () => {
    const code = stripComments(VIEW);
    expect(code).toContain("s.productMode === 'ready-made'");
    expect(code).toContain('<ReadyMadeDeliveryPanel');
  });

  it('it never assumes personalized before the server has answered', () => {
    const code = stripComments(VIEW);
    // The unknown state is its own branch, so a ready-made buyer is never shown a render
    // narrative while the mode is still being fetched.
    expect(code).toContain('mode === null');
    expect(code).toMatch(/useState<'ready-made' \| 'personalized' \| null>\(null\)/);
  });

  it('a failed status read falls back to the render flow, never to a broken page', () => {
    expect(stripComments(VIEW)).toMatch(/catch\(\(\) => \{ if \(!cancelled\) setMode\('personalized'\); \}\)/);
  });
});

describe('no fake render narrative for ready-made', () => {
  it.each(RENDER_NARRATIVE)('the ready-made panel never says %s', (phrase) => {
    expect(PANEL).not.toContain(phrase);
  });

  it('the ready-made panel does not mount ProcessingStatus', () => {
    expect(PANEL).not.toContain('ProcessingStatus');
  });

  it('the fabricated stage labels still live only in the render component', () => {
    // Personalized orders keep them — they describe work that genuinely happens there.
    for (const phrase of ['Preparing your photos', 'Composing the banner', 'Rendering at 300 DPI']) {
      expect(PROCESSING).toContain(phrase);
    }
  });
});

describe('required customer-facing copy', () => {
  it.each([
    'Thank you — your artwork is ready.',
    'Your purchase is complete.',
    'Download your artwork below.',
    'Download Your Artwork',
    'Discover More CelebrateBanner Designs',
    'Continue Shopping',
    'https://www.celebratebanner.com/',
  ])('the panel shows %s', (phrase) => {
    expect(PANEL).toContain(phrase);
  });

  it('the product name comes from the order, not a hard-coded string', () => {
    expect(PANEL).toContain('delivery?.productName');
    expect(PANEL).not.toContain("'The Beauty of the World'");
  });
});

describe('the download is real and secure', () => {
  it('the CTA renders the server-authorized URL', () => {
    const code = stripComments(PANEL);
    expect(code).toContain('href={delivery.downloadUrl}');
    expect(code).toContain('delivery?.available');
  });

  it('it asks the delivery endpoint, not the dead render-status field', () => {
    expect(stripComments(PANEL)).toContain('.getReadyMadeDelivery(projectId');
    // s.downloadUrl is the render-only field getStatus has never populated.
    expect(stripComments(PANEL)).not.toContain('downloadUrl: s.');
    expect(API).toContain('/delivery');
  });

  it('no raw S3, CDN, bucket or master-key reference reaches the browser', () => {
    for (const src of [PANEL, VIEW]) {
      for (const forbidden of ['s3.amazonaws', 's3Key', 'masterAssetKey', 'READY_MADE_BEAUTY_ASSET_KEY', 'cloudfront']) {
        expect(src).not.toContain(forbidden);
      }
    }
  });

  it('the link is never persisted, so it cannot outlive its authorization', () => {
    for (const store of ['localStorage', 'sessionStorage', 'document.cookie']) {
      expect(PANEL).not.toContain(store);
    }
  });

  it('a denied order shows the server-supplied reason instead of a button', () => {
    const code = stripComments(PANEL);
    expect(code).toContain('{delivery.message}');
    expect(code).toContain('!delivery.available');
  });

  it('a failed authorization still points the customer at their email', () => {
    expect(PANEL).toContain('still works');
    expect(stripComments(PANEL)).toContain('setFailed(true)');
  });
});

describe('personalized orders are untouched', () => {
  it('the render progress flow is still mounted for them', () => {
    const code = stripComments(VIEW);
    expect(code).toContain('<ProcessingStatus');
    expect(code).toContain('Your banner is rendering now');
  });

  it('ProcessingStatus itself was not modified to know about ready-made', () => {
    expect(PROCESSING).not.toContain('ready-made');
    expect(PROCESSING).not.toContain('productMode');
  });
});

describe('the API client contract', () => {
  it('status carries the product mode', () => {
    expect(API).toContain("productMode?: 'ready-made' | 'personalized'");
  });

  it('delivery is requested with the same project-scoped credentials as status', () => {
    const at = API.indexOf('getReadyMadeDelivery(');   // the method, not the doc comment
    const fn = API.slice(at, at + 700);
    expect(fn).toContain('session_id=');
    expect(fn).toContain('Bearer ${opts.projectToken}');
  });
});
