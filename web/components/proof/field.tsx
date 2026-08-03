import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { ChangeEvent, ReactNode } from 'react';
import type { SelectOption } from '@/lib/proof/types';

/**
 * Small internal form primitives shared by the proof forms. Not part of the public UI
 * foundation — they exist to keep TeamInfoForm and DesignPreferencesForm DRY and
 * consistently accessible (label association, error wiring, focus rings).
 */

const inputBase =
  'w-full rounded-lg border bg-white px-4 py-2.5 text-obsidian placeholder:text-obsidian/35 ' +
  'transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1';

function tone(error?: string) {
  return error ? 'border-rose focus-visible:ring-rose' : 'border-obsidian/15 hover:border-obsidian/30';
}

function FieldShell({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-obsidian">
        {label}
        {required && (
          <span className="ml-1 text-rose" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-obsidian/50">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-rose">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  const ids = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel';
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel';
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required,
  error,
  hint,
  placeholder,
  autoComplete,
  inputMode,
}: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} required={required} error={error} hint={hint}>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className={cn(inputBase, tone(error))}
      />
    </FieldShell>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
  placeholder?: string;
}

export function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
  hint,
  placeholder,
}: TextAreaFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint}>
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        aria-describedby={describedBy(id, undefined, hint)}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className={cn(inputBase, tone(), 'resize-y')}
      />
    </FieldShell>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  hint?: string;
}

export function SelectField({ label, value, onChange, options, hint }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint}>
      <select
        id={id}
        value={value}
        aria-describedby={describedBy(id, undefined, hint)}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        className={cn(inputBase, tone(), 'appearance-none bg-[length:0] pr-10')}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
