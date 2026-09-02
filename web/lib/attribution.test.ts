import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  attributionPayload,
  captureAttribution,
  getAttribution,
  parseAttribution,
} from '@/lib/attribution';

/**
 * Campaign attribution must survive the journey from a social link to checkout — that is the
 * whole point of the tracking layer. These tests exercise the real capture/persist/read path
 * against a localStorage stand-in, then pin the wiring that carries it to Stripe.
 */

const WEB_ROOT = process.cwd();
const CAMPAIGN = 'beauty_world_launch';
const PLATFORMS = ['instagram', 'facebook', 'tiktok', 'pinterest', 'youtube'] as const;

/** Minimal first-party storage stand-in — no third-party cookie, no fingerprint. */
function installStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  (globalThis as unknown as { window: unknown }).window = {
    localStorage,
    location: { search: '' },
  };
  // globalThis.crypto already exists in this runtime and is getter-only — leave it alone.
  return store;
}

beforeEach(() => {
  installStorage();
});

describe('UTM capture', () => {
  it.each(PLATFORMS)('%s attribution persists to checkout', (platform) => {
    captureAttribution(
      `?utm_source=${platform}&utm_medium=organic&utm_campaign=${CAMPAIGN}&utm_content=creative_01`,
    );

    // Later, untagged navigation to checkout — the campaign must still be known.
    const atCheckout = attributionPayload(captureAttribution(''));
    expect(atCheckout.utmSource).toBe(platform);
    expect(atCheckout.utmMedium).toBe('organic');
    expect(atCheckout.utmCampaign).toBe(CAMPAIGN);
    expect(atCheckout.utmContent).toBe('creative_01');
    expect(atCheckout.attributionId).toMatch(/^[a-z0-9]{8,}$/);
  });

  it('utm_content persists so creatives can be compared', () => {
    for (const creative of ['creative_01', 'creative_02', 'video_01', 'story_01']) {
      installStorage();
      captureAttribution(`?utm_source=instagram&utm_content=${creative}`);
      expect(attributionPayload(getAttribution()).utmContent).toBe(creative);
    }
  });

  it('a later untagged page view does not erase the campaign', () => {
    captureAttribution(`?utm_source=tiktok&utm_campaign=${CAMPAIGN}`);
    captureAttribution('');
    captureAttribution('?someOtherParam=1');
    expect(getAttribution().utmSource).toBe('tiktok');
  });

  it('a new campaign link takes over from an older one', () => {
    captureAttribution('?utm_source=facebook&utm_content=creative_01');
    const first = getAttribution().attributionId;
    captureAttribution('?utm_source=pinterest&utm_content=creative_02');
    const after = getAttribution();
    expect(after.utmSource).toBe('pinterest');
    expect(after.utmContent).toBe('creative_02');
    // Same visitor thread — the join id is kept so the earlier view still links up.
    expect(after.attributionId).toBe(first);
  });

  it('values are normalised and length-capped', () => {
    captureAttribution(`?utm_source=${'  InStaGram  '.trim()}&utm_campaign=${'x'.repeat(200)}`);
    const a = getAttribution();
    expect(a.utmSource).toBe('instagram');
    expect(a.utmCampaign.length).toBeLessThanOrEqual(64);
  });
});

describe('direct / unknown traffic', () => {
  it('works normally and is classified, not blocked', () => {
    const a = captureAttribution('');
    expect(a.utmSource).toBe('direct');
    expect(a.utmMedium).toBe('direct');
    expect(a.utmCampaign).toBe('unknown');
    // Still produces a usable payload so checkout is never blocked.
    expect(attributionPayload(a).utmSource).toBe('direct');
  });

  it('parseAttribution returns null when there is no campaign tag', () => {
    expect(parseAttribution('')).toBeNull();
    expect(parseAttribution('?utm_medium=organic')).toBeNull();
    expect(parseAttribution('?ref=someone')).toBeNull();
  });

  it('degrades to direct when storage is unavailable', () => {
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: {
        getItem() { throw new Error('denied'); },
        setItem() { throw new Error('denied'); },
      },
      location: { search: '' },
    };
    expect(() => captureAttribution('')).not.toThrow();
    expect(getAttribution().utmSource).toBe('direct');
  });
});

describe('privacy', () => {
  it('collects no personal or device data', () => {
    const src = readFileSync(path.join(WEB_ROOT, 'lib/attribution.ts'), 'utf8');
    for (const forbidden of ['userAgent', 'screen.', 'canvas', 'navigator.plugins', 'document.cookie']) {
      expect(src, `${forbidden} must not be read`).not.toContain(forbidden);
    }
    // The only identifier is random, not derived from the device.
    expect(src).toContain('crypto.getRandomValues');
  });
});

describe('wiring to checkout and product pages', () => {
  it('both checkout paths attach attribution', () => {
    const button = readFileSync(path.join(WEB_ROOT, 'components/checkout-button.tsx'), 'utf8');
    const review = readFileSync(path.join(WEB_ROOT, 'components/checkout/order-review.tsx'), 'utf8');
    expect(button).toContain('attribution: attributionPayload()');
    expect(review).toContain('attribution: attributionPayload()');
  });

  it('the product page fires a product_view for both product modes', () => {
    const page = readFileSync(path.join(WEB_ROOT, 'app/products/[slug]/page.tsx'), 'utf8');
    expect(page).toContain('ProductViewTracker');
    expect(page).toContain('productMode={product.productMode}');
  });

  it('only product_view is sent from the browser', () => {
    const src = readFileSync(path.join(WEB_ROOT, 'lib/attribution.ts'), 'utf8');
    expect(src).toContain("event: 'product_view'");
    expect(src).not.toContain('purchase_completed');
    expect(src).not.toContain('checkout_started');
  });
});
