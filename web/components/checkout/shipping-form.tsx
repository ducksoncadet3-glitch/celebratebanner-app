import { SelectField, TextField } from '@/components/proof/field';
import type { ShippingErrors } from '@/lib/checkout/order';
import type { ShippingAddress } from '@/lib/api';

export interface ShippingFormProps {
  value: ShippingAddress;
  onChange: (patch: Partial<ShippingAddress>) => void;
  errors: ShippingErrors;
}

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
];

/**
 * Shipping address fields for print orders. Reuses the shared field primitives so styling,
 * labelling, and error/aria wiring match the rest of the app. Controlled by OrderReview.
 */
export function ShippingForm({ value, onChange, errors }: ShippingFormProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          label="Recipient name"
          value={value.name}
          onChange={(v) => onChange({ name: v })}
          required
          error={errors.name}
          autoComplete="name"
          placeholder="Full name"
        />
      </div>
      <div className="sm:col-span-2">
        <TextField
          label="Street address"
          value={value.line1}
          onChange={(v) => onChange({ line1: v })}
          required
          error={errors.line1}
          autoComplete="address-line1"
          placeholder="123 Main St"
        />
      </div>
      <div className="sm:col-span-2">
        <TextField
          label="Apartment, suite, etc."
          value={value.line2 ?? ''}
          onChange={(v) => onChange({ line2: v })}
          hint="Optional"
          autoComplete="address-line2"
          placeholder="Apt 4B"
        />
      </div>
      <TextField
        label="City"
        value={value.city}
        onChange={(v) => onChange({ city: v })}
        required
        error={errors.city}
        autoComplete="address-level2"
      />
      <TextField
        label="State / region"
        value={value.state}
        onChange={(v) => onChange({ state: v })}
        required
        error={errors.state}
        autoComplete="address-level1"
      />
      <TextField
        label="ZIP / postal code"
        value={value.postalCode}
        onChange={(v) => onChange({ postalCode: v })}
        required
        error={errors.postalCode}
        autoComplete="postal-code"
        inputMode="text"
      />
      <SelectField
        label="Country"
        value={value.country}
        onChange={(v) => onChange({ country: v })}
        options={COUNTRIES}
      />
    </div>
  );
}
