import { TextField } from './field';
import type { ProofErrors, TeamInfo } from '@/lib/proof/types';

export interface TeamInfoFormProps {
  value: TeamInfo;
  onChange: (patch: Partial<TeamInfo>) => void;
  errors: ProofErrors;
}

/**
 * Collects who the proof is for and how to reach them. Team name, contact name, and email
 * are required; phone is optional. Controlled entirely by the wizard so navigating away and
 * back preserves every field.
 */
export function TeamInfoForm({ value, onChange, errors }: TeamInfoFormProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <TextField
          label="Team or event name"
          value={value.teamName}
          onChange={(v) => onChange({ teamName: v })}
          required
          error={errors.teamName}
          placeholder="e.g. Riverside Eagles Football"
          autoComplete="organization"
        />
      </div>
      <TextField
        label="Your name"
        value={value.contactName}
        onChange={(v) => onChange({ contactName: v })}
        required
        error={errors.contactName}
        placeholder="First and last name"
        autoComplete="name"
      />
      <TextField
        label="Email"
        type="email"
        inputMode="email"
        value={value.email}
        onChange={(v) => onChange({ email: v })}
        required
        error={errors.email}
        hint="We'll send your free proof here."
        placeholder="you@example.com"
        autoComplete="email"
      />
      <div className="sm:col-span-2">
        <TextField
          label="Phone"
          type="tel"
          inputMode="tel"
          value={value.phone}
          onChange={(v) => onChange({ phone: v })}
          hint="Optional — only if you'd like a call about your design."
          placeholder="(555) 123-4567"
          autoComplete="tel"
        />
      </div>
    </div>
  );
}
