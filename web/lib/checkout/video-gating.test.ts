import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  PRICING,
  PRODUCT_ORDER,
  PURCHASABLE_PRODUCTS,
  VIDEO_UPSELL_PUBLIC,
  isPurchasable,
} from '@/lib/pricing';
import { orderProductIds, parseOrderParams, type OrderParams } from '@/lib/checkout/order';

/**
 * The $19 video slideshow is implemented end to end (encoder, worker branch, S3 upload,
 * download token) but has never been certified by a real paid order, and the worker
 * swallows a video failure — so a customer could pay for it and silently receive only the
 * banner. It is therefore gated OFF for the public launch.
 *
 * These tests pin two separate things: that the backend capability is preserved, and that
 * no public surface can sell it while the gate is closed.
 */

const WEB_ROOT = process.cwd();
const REPO_ROOT = path.join(WEB_ROOT, '..');

describe('video capability is preserved for future certification', () => {
  it('the video SKU and its price remain defined', () => {
    expect(PRICING.video).toBeDefined();
    expect(PRICING.video.amountCents).toBe(1900);
    expect(PRICING.video.metadata.fulfillment).toBe('video');
    expect(PRODUCT_ORDER).toContain('video');
  });

  it('the backend encoder and worker branch are still present', () => {
    const encoder = readFileSync(path.join(REPO_ROOT, 'backend-stub/video/encoder.js'), 'utf8');
    expect(encoder).toContain('renderVideoSlideshow');
    const worker = readFileSync(path.join(REPO_ROOT, 'backend-stub/workers/render.worker.js'), 'utf8');
    expect(worker).toContain('renderVideoSlideshow');
    expect(worker).toContain("productIds.includes('video')");
  });

  it('a delivered video can still be downloaded', () => {
    // Post-purchase delivery is not advertising — it must keep working for any order that
    // already has (or later gets) a video asset.
    const success = readFileSync(path.join(WEB_ROOT, 'components/success-view.tsx'), 'utf8');
    expect(success).toContain('video');
  });
});

describe('video is not sellable while the gate is closed', () => {
  it('the gate is closed for the public launch', () => {
    expect(VIDEO_UPSELL_PUBLIC).toBe(false);
  });

  it('video is not in the purchasable set', () => {
    expect(PURCHASABLE_PRODUCTS).toEqual(['digital', 'print']);
    expect(isPurchasable('video')).toBe(false);
    expect(isPurchasable('digital')).toBe(true);
    expect(isPurchasable('print')).toBe(true);
  });

  it('a hand-crafted ?video=1 URL cannot attach the SKU', () => {
    const params = parseOrderParams({ product: 'print', video: '1', project: 'proj_x' });
    expect(params).not.toBeNull();
    expect(params!.addVideo).toBe(false);
    expect(orderProductIds(params!)).toEqual(['print']);
  });

  it('even a forced addVideo flag cannot reach the order', () => {
    const forced: OrderParams = {
      productId: 'digital',
      projectId: 'proj_x',
      templateId: 'graduation',
      renderType: 'standard',
      addVideo: true,
    };
    expect(orderProductIds(forced)).toEqual(['digital']);
  });

  it('the pricing page advertises no video offer', () => {
    const page = readFileSync(path.join(WEB_ROOT, 'app/pricing/page.tsx'), 'utf8');
    expect(page).not.toMatch(/video/i);
    expect(page).not.toContain('$19');
  });

  it('the pricing cards render the video block only behind the gate', () => {
    const cards = readFileSync(path.join(WEB_ROOT, 'components/pricing-cards.tsx'), 'utf8');
    // The markup may stay in the file, but it must be conditional on the flag.
    expect(cards).toContain('VIDEO_UPSELL_PUBLIC &&');
    expect(cards).toContain('addVideo={addVideo}');
    expect(cards).not.toContain('addVideo={video}');
  });
});
