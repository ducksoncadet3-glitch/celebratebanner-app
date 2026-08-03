import { describe, expect, it } from 'vitest';
import {
  EMPTY_SHIPPING,
  buildCheckoutInput,
  isOrderValid,
  orderProductIds,
  orderTotalCents,
  parseOrderParams,
  requiresShipping,
  validateContact,
  validateShipping,
  type OrderParams,
} from './order';
import { PRICING } from '@/lib/pricing';
import type { ShippingAddress } from '@/lib/api';

const digitalOrder: OrderParams = {
  productId: 'digital',
  projectId: 'proj_abc',
  templateId: 'graduation',
  renderType: 'standard',
  addVideo: false,
};

const printOrder: OrderParams = { ...digitalOrder, productId: 'print', renderType: 'premium' };

const validShipping: ShippingAddress = {
  name: 'Coach Kim',
  line1: '123 Main St',
  line2: 'Suite 5',
  city: 'West Palm Beach',
  state: 'FL',
  postalCode: '33401',
  country: 'us',
};

describe('parseOrderParams', () => {
  it('parses a full valid query', () => {
    const out = parseOrderParams({
      product: 'print',
      project: 'proj_x',
      template: 'champion',
      render: 'premium',
      video: '1',
    });
    expect(out).toEqual({
      productId: 'print',
      projectId: 'proj_x',
      templateId: 'champion',
      renderType: 'premium',
      addVideo: true,
    });
  });

  it('applies defaults for missing template/render/video', () => {
    const out = parseOrderParams({ product: 'digital' });
    expect(out).toEqual({
      productId: 'digital',
      projectId: '',
      templateId: 'graduation',
      renderType: 'standard',
      addVideo: false,
    });
  });

  it('returns null for a missing or invalid product', () => {
    expect(parseOrderParams({})).toBeNull();
    expect(parseOrderParams({ product: 'bogus' })).toBeNull();
    expect(parseOrderParams({ product: '' })).toBeNull();
  });

  it('coerces an invalid render type to standard', () => {
    expect(parseOrderParams({ product: 'digital', render: 'ultra' })?.renderType).toBe('standard');
  });

  it('takes the first value when a param arrives as an array', () => {
    expect(parseOrderParams({ product: ['print', 'digital'] })?.productId).toBe('print');
  });
});

describe('requiresShipping', () => {
  it('matches the pricing metadata', () => {
    expect(requiresShipping('digital')).toBe(false);
    expect(requiresShipping('print')).toBe(true);
    expect(requiresShipping('video')).toBe(false);
    expect(requiresShipping('print')).toBe(PRICING.print.metadata.requiresShipping);
  });
});

describe('order line items + total', () => {
  it('lists only the primary product without the video add-on', () => {
    expect(orderProductIds(digitalOrder)).toEqual(['digital']);
    expect(orderTotalCents(digitalOrder)).toBe(PRICING.digital.amountCents);
  });

  it('appends the video add-on and sums the total', () => {
    const withVideo = { ...printOrder, addVideo: true };
    expect(orderProductIds(withVideo)).toEqual(['print', 'video']);
    expect(orderTotalCents(withVideo)).toBe(PRICING.print.amountCents + PRICING.video.amountCents);
  });

  it('does not double-add video when the product IS video', () => {
    const videoOnly: OrderParams = { ...digitalOrder, productId: 'video', addVideo: true };
    expect(orderProductIds(videoOnly)).toEqual(['video']);
  });
});

describe('validateContact', () => {
  it('flags empty and malformed emails', () => {
    expect(validateContact('').email).toBeTruthy();
    expect(validateContact('not-an-email').email).toBeTruthy();
  });
  it('accepts a valid email', () => {
    expect(validateContact('coach@example.com')).toEqual({});
  });
});

describe('validateShipping', () => {
  it('requires all address fields except line2', () => {
    const errors = validateShipping(EMPTY_SHIPPING);
    expect(errors.name).toBeTruthy();
    expect(errors.line1).toBeTruthy();
    expect(errors.city).toBeTruthy();
    expect(errors.state).toBeTruthy();
    expect(errors.postalCode).toBeTruthy();
    // country defaults to 'US' in EMPTY_SHIPPING → not an error
    expect(errors.country).toBeUndefined();
  });
  it('passes a complete address (line2 optional)', () => {
    expect(validateShipping(validShipping)).toEqual({});
    expect(validateShipping({ ...validShipping, line2: '' })).toEqual({});
  });
});

describe('isOrderValid', () => {
  it('digital: valid with just an email, ignores shipping', () => {
    expect(isOrderValid(digitalOrder, 'a@b.com', EMPTY_SHIPPING)).toBe(true);
  });
  it('print: invalid without shipping, valid with it', () => {
    expect(isOrderValid(printOrder, 'a@b.com', EMPTY_SHIPPING)).toBe(false);
    expect(isOrderValid(printOrder, 'a@b.com', validShipping)).toBe(true);
  });
  it('any: invalid with a bad email', () => {
    expect(isOrderValid(digitalOrder, 'nope', EMPTY_SHIPPING)).toBe(false);
  });
});

describe('buildCheckoutInput', () => {
  it('builds a digital payload with no shipping and no name when omitted', () => {
    const input = buildCheckoutInput(digitalOrder, { email: ' a@b.com ' }, null);
    expect(input).toEqual({
      projectId: 'proj_abc',
      templateId: 'graduation',
      renderType: 'standard',
      customerEmail: 'a@b.com',
      items: [{ productId: 'digital' }],
    });
    expect(input.shipping).toBeUndefined();
    expect(input.customerName).toBeUndefined();
  });

  it('attaches normalized shipping + name for a print order', () => {
    const input = buildCheckoutInput(printOrder, { email: 'a@b.com', name: '  Kim  ' }, validShipping);
    expect(input.customerName).toBe('Kim');
    expect(input.shipping).toEqual({
      name: 'Coach Kim',
      line1: '123 Main St',
      line2: 'Suite 5',
      city: 'West Palm Beach',
      state: 'FL',
      postalCode: '33401',
      country: 'US', // upper-cased
    });
    expect(input.items).toEqual([{ productId: 'print' }]);
  });

  it('omits shipping for a digital order even if an address is passed', () => {
    const input = buildCheckoutInput(digitalOrder, { email: 'a@b.com' }, validShipping);
    expect(input.shipping).toBeUndefined();
  });

  it('includes the video line item when addVideo is set', () => {
    const input = buildCheckoutInput({ ...printOrder, addVideo: true }, { email: 'a@b.com' }, validShipping);
    expect(input.items).toEqual([{ productId: 'print' }, { productId: 'video' }]);
  });

  it('drops line2 from shipping when empty', () => {
    const input = buildCheckoutInput(printOrder, { email: 'a@b.com' }, { ...validShipping, line2: '' });
    expect(input.shipping && 'line2' in input.shipping).toBe(false);
  });
});
