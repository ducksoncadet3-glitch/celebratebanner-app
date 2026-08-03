import { SelectField, TextAreaField, TextField } from './field';
import { FORMAT_OPTIONS, SIZE_OPTIONS } from '@/lib/proof/options';
import type { DesignPreferences } from '@/lib/proof/types';

export interface DesignPreferencesFormProps {
  value: DesignPreferences;
  onChange: (patch: Partial<DesignPreferences>) => void;
}

/**
 * Optional design direction — colors, size, format, and free-form notes. Nothing here is
 * required; it just helps the design team produce a closer first proof.
 */
export function DesignPreferencesForm({ value, onChange }: DesignPreferencesFormProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          label="Team colors"
          value={value.colors}
          onChange={(v) => onChange({ colors: v })}
          hint="Optional — e.g. navy, gold, and white."
          placeholder="Navy & gold"
        />
      </div>
      <SelectField
        label="Preferred size"
        value={value.size}
        onChange={(v) => onChange({ size: v })}
        options={SIZE_OPTIONS}
      />
      <SelectField
        label="Format"
        value={value.format}
        onChange={(v) => onChange({ format: v })}
        options={FORMAT_OPTIONS}
      />
      <div className="sm:col-span-2">
        <TextAreaField
          label="Anything else we should know?"
          value={value.notes}
          onChange={(v) => onChange({ notes: v })}
          hint="Optional — player names, wording, deadlines, or inspiration."
          placeholder="Tell us anything that will help us design your proof."
        />
      </div>
    </div>
  );
}
