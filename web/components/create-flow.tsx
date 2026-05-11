'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PhotoUploader, type UploadedFile } from './photo-uploader';
import { Button } from './ui/button';
import { CheckoutButton } from './checkout-button';
import { cn } from '@/lib/utils';

const TEMPLATES = [
  { id: 'graduation', name: 'Graduation', emoji: '🎓' },
  { id: 'wedding', name: 'Wedding', emoji: '💍' },
  { id: 'anniversary', name: 'Anniversary', emoji: '🥂' },
  { id: 'champion', name: 'Champions', emoji: '🏆' },
  { id: 'america250', name: 'America 250', emoji: '🇺🇸' },
  { id: 'worldcup2026', name: 'World Cup 2026', emoji: '⚽' },
  { id: 'pets', name: 'Pets', emoji: '🐾' },
  { id: 'milestone', name: 'Milestone', emoji: '✨' },
];

const STEPS = ['Theme', 'Photos', 'Details'] as const;

export function CreateFlow() {
  const [step, setStep] = useState(0);
  const [theme, setTheme] = useState<string>('graduation');
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [hero, setHero] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [school, setSchool] = useState('');

  const canContinue = useMemo(() => {
    if (step === 0) return !!theme;
    if (step === 1) return photos.length > 0;
    return true;
  }, [step, theme, photos]);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="rounded-2xl border border-gold/15 bg-white p-6 sm:p-8 shadow-lift">
        <Stepper step={step} />

        {step === 0 && (
          <>
            <h2 className="text-2xl">Choose your theme</h2>
            <p className="mt-1 text-sm text-obsidian/65">
              Each theme has its own palette, fonts, and layout — pick the one that matches your moment.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition',
                      theme === t.id
                        ? 'border-gold bg-gold/5 shadow-gold'
                        : 'border-gold/15 bg-white hover:border-gold/40',
                    )}
                  >
                    <span className="text-2xl" aria-hidden>{t.emoji}</span>
                    <span className="font-medium">{t.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-2xl">Upload your photos</h2>
            <p className="mt-1 text-sm text-obsidian/65">
              Up to 50 photos. Tap any photo to set it as the hero shot.
            </p>
            <div className="mt-6">
              <PhotoUploader
                value={photos}
                onChange={setPhotos}
                heroId={hero}
                onHeroChange={setHero}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl">Personalize the text</h2>
            <p className="mt-1 text-sm text-obsidian/65">
              Add the name, year, and any subtitle — all three are optional and editable later.
            </p>
            <div className="mt-6 space-y-4">
              <Field label="Name or names" value={name} onChange={setName} placeholder="e.g., Sarah Johnson" />
              <Field label="Year or date" value={year} onChange={setYear} placeholder="e.g., Class of 2026" />
              <Field label="Subtitle" value={school} onChange={setSchool} placeholder="e.g., Lincoln High" />
            </div>
          </>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gold/15 pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            ← Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="gold" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
              Continue →
            </Button>
          ) : (
            <p className="text-sm text-obsidian/60">
              All set — pick a delivery option on the right to check out.
            </p>
          )}
        </div>
      </section>

      <aside className="rounded-2xl border border-gold/15 bg-white p-6 shadow-lift">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">Order summary</p>
        <dl className="mt-4 space-y-2 text-sm">
          <Row k="Theme" v={TEMPLATES.find((t) => t.id === theme)?.name ?? '—'} />
          <Row k="Photos" v={photos.length === 0 ? '—' : `${photos.length} uploaded`} />
          <Row k="Hero" v={hero ? 'Selected' : '—'} />
          <Row k="Name" v={name || '—'} />
          <Row k="Size" v="24×36″" />
        </dl>

        <div className="mt-5 space-y-3">
          <CheckoutButton
            productId="digital"
            templateId={theme}
            renderType="standard"
            variant="gold"
          >
            Get digital — $9.99
          </CheckoutButton>
          <CheckoutButton
            productId="print"
            templateId={theme}
            renderType="premium"
            variant="primary"
          >
            Order printed — $49
          </CheckoutButton>
        </div>

        <p className="mt-4 text-[11px] text-obsidian/55">
          Secure checkout by Stripe. You only pay at this step — designing is always free.{' '}
          <Link href="/pricing" className="underline-offset-2 hover:underline">
            See what&apos;s included
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em]">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex h-6 w-6 items-center justify-center rounded-full border-2',
              i <= step ? 'border-gold bg-gold text-obsidian' : 'border-gold/30 text-obsidian/40',
            )}
          >
            {i + 1}
          </span>
          <span className={i === step ? 'text-obsidian' : 'text-obsidian/40'}>{label}</span>
          {i < STEPS.length - 1 && <span aria-hidden className="text-gold/30">·</span>}
        </li>
      ))}
    </ol>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-obsidian/60">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={48}
        className="mt-1 block w-full rounded-xl border border-gold/25 bg-ivory px-4 py-3 text-base outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/20"
      />
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-obsidian/60">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
