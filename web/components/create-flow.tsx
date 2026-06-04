'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useProjectStore } from '@/lib/project-store';
import { buildRenderInput, serializeRenderInput, type RenderInputV1 } from '@/lib/render-input.schema';
import { themeById, THEME_DISPLAY } from '@/lib/themes';
import { api, ApiError } from '@/lib/api';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { CheckoutButton } from './checkout-button';
import { ArrangementPicker } from './arrangement-picker';
import { FramePicker } from './frame-picker';
import { PhotoUploadTray } from './photo-upload-tray';
import { BannerPreview } from './banner-preview';
import { cn } from '@/lib/utils';

const STEPS = ['Theme', 'Photos', 'Design'] as const;

export function CreateFlow() {
  const { state, dispatch, isDirty } = useProjectStore();
  const [step, setStep] = useState(0);

  // Build the canonical RenderInput from state — used by both the preview and
  // the autosave PATCH. Memoize so the preview canvas only re-renders when the
  // user actually changes something.
  const renderInput: RenderInputV1 | null = useMemo(() => {
    if (state.photos.length === 0) return null;
    try {
      return buildRenderInput({
        projectId: state.projectId,
        width: 800,
        height: 1200,
        arrangement: state.arrangement,
        theme: themeById(state.themeId),
        bannerText: state.bannerText,
        photos: state.photos,
        heroId: state.heroId,
        frames: state.frames,
        defaultFrame: state.defaultFrame,
        rotations: state.rotations,
        seed: state.seed,
        cinematicHero: true,
      });
    } catch (err) {
      // Zod validation failed — surface in dev, but don't crash the UI.
      // eslint-disable-next-line no-console
      console.warn('[create] render input invalid', err);
      return null;
    }
  }, [state]);

  // Autosave to backend every 5s when dirty. Local autosave is handled inside
  // useProjectStore (debounced 400ms to localStorage).
  const saveTimer = useRef<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!isDirty || !renderInput) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSaving(true);
      try {
        const { rev } = await api.saveProject(state.projectId, {
          renderInput: JSON.parse(serializeRenderInput(renderInput)),
          rev: state.rev,
        });
        dispatch({ type: 'markSaved', rev });
      } catch (err) {
        if (!(err instanceof ApiError) || err.status >= 500) {
          // eslint-disable-next-line no-console
          console.warn('[autosave] server unreachable; keeping local copy', err);
        }
      } finally {
        setSaving(false);
      }
    }, 5000);
    return () => window.clearTimeout(saveTimer.current);
  }, [isDirty, renderInput, state.projectId, state.rev, dispatch]);

  // For the preview canvas we hand it photos with image: HTMLImageElement-like
  // objects (the lazy <img> below decodes them; we shim with a fake CanvasImage
  // that just exposes naturalWidth/Height — actual decoded bitmaps come from
  // the hidden <img> tags below via cache).
  const previewInput = useMemo(() => {
    if (!renderInput) return null;
    return {
      ...renderInput,
      photos: renderInput.photos.map((p) => ({
        id: p.id,
        image: imageCache.get(p.url) ?? makePlaceholderImage(p),
      })),
    };
  }, [renderInput]);

  const canContinue =
    (step === 0 && !!state.themeId) ||
    (step === 1 && state.photos.length > 0) ||
    step === 2;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      {/* Pre-decode every uploaded image so the engine has bitmaps ready when
          the preview renders. The img tags are visually hidden but keep the
          decoded bitmap in the browser's image cache. */}
      <div className="hidden">
        {state.photos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.id}
            src={p.url}
            alt=""
            onLoad={(e) => imageCache.set(p.url, e.currentTarget)}
            crossOrigin="anonymous"
            decoding="async"
          />
        ))}
      </div>

      <section className="rounded-2xl border border-gold/15 bg-white p-6 sm:p-8 shadow-lift">
        <Stepper step={step} />

        {step === 0 && (
          <>
            <h2 className="text-2xl">Choose your theme</h2>
            <p className="mt-1 text-sm text-obsidian/65">
              Each theme has its own palette, typography, and text fields.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {THEME_DISPLAY.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'setTheme', themeId: t.id })}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition',
                      state.themeId === t.id
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
              Up to 50 photos. Tap any to set it as the hero shot. Use ↻ to rotate.
            </p>
            <div className="mt-6">
              <PhotoUploadTray
                projectId={state.projectId}
                photos={state.photos}
                heroId={state.heroId}
                rotations={state.rotations}
                onAdd={(photos) => dispatch({ type: 'addPhotos', photos })}
                onRemove={(id) => dispatch({ type: 'removePhoto', id })}
                onSetHero={(id) => dispatch({ type: 'setHero', id })}
                onRotate={(id) => dispatch({ type: 'rotatePhoto', id })}
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl">Design your banner</h2>
            <p className="mt-1 text-sm text-obsidian/65">
              Pick an arrangement, choose a default frame, and personalize the headline.
            </p>

            <div className="mt-6 space-y-7">
              {/* Text fields based on the selected theme */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  Headline text
                </p>
                {themeById(state.themeId).fields.map((key) => {
                  const meta = themeById(state.themeId).fieldMeta?.[key];
                  return (
                    <label key={key} className="block">
                      <span className="block text-xs font-medium text-obsidian/55">{meta?.label ?? key}</span>
                      <input
                        type="text"
                        value={state.bannerText[key] ?? ''}
                        onChange={(e) => dispatch({ type: 'setText', key, value: e.target.value })}
                        placeholder={meta?.placeholder ?? ''}
                        maxLength={120}
                        className="mt-1 w-full rounded-lg border border-gold/25 bg-ivory px-3 py-2 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                      />
                    </label>
                  );
                })}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  Arrangement
                </p>
                <div className="mt-3">
                  <ArrangementPicker
                    value={state.arrangement}
                    onChange={(arrangement) => dispatch({ type: 'setArrangement', arrangement })}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  Default frame — applied to every photo
                </p>
                <div className="mt-3">
                  <FramePicker
                    value={state.defaultFrame}
                    onChange={(frame) => dispatch({ type: 'setDefaultFrame', frame })}
                  />
                </div>
              </div>
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
          <div className="flex items-center gap-3 text-xs text-obsidian/55">
            {saving && (<><Spinner className="h-3 w-3" /> Saving…</>)}
            {!saving && !isDirty && <span>All changes saved</span>}
          </div>
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="gold" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
              Continue →
            </Button>
          ) : (
            <p className="text-sm text-obsidian/60">Pick a delivery on the right →</p>
          )}
        </div>
      </section>

      <aside className="space-y-5">
        {previewInput && (
          <div className="rounded-2xl border border-gold/20 bg-white p-3 shadow-lift">
            <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-dark">
              Live preview
            </p>
            <BannerPreview input={previewInput} className="h-auto w-full rounded-lg" />
            <p className="mt-2 px-1 text-[10px] text-obsidian/45">
              800×1200 preview · final export 7200×10800 @ 300 DPI
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-gold/15 bg-white p-6 shadow-lift">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">Order summary</p>
          <dl className="mt-4 space-y-2 text-sm">
            <Row k="Theme" v={THEME_DISPLAY.find((t) => t.id === state.themeId)?.name ?? '—'} />
            <Row k="Photos" v={state.photos.length === 0 ? '—' : `${state.photos.length} uploaded`} />
            <Row k="Arrangement" v={state.arrangement} />
            <Row k="Frame" v={state.defaultFrame} />
            <Row k="Size" v="24×36″ @ 300 DPI" />
          </dl>

          <div className="mt-5 space-y-3">
            <CheckoutButton
              productId="digital"
              projectId={state.projectId}
              templateId={state.themeId}
              renderType="standard"
              variant="gold"
            >
              Get digital — $9.99
            </CheckoutButton>
            <CheckoutButton
              productId="print"
              projectId={state.projectId}
              templateId={state.themeId}
              renderType="premium"
              variant="primary"
            >
              Order printed — $79.99
            </CheckoutButton>
          </div>

          <p className="mt-4 text-[11px] text-obsidian/55">
            Stripe Checkout. You only pay at this step.{' '}
            <Link href="/pricing" className="underline-offset-2 hover:underline">
              See what&apos;s included
            </Link>
            .
          </p>
        </div>
      </aside>
    </div>
  );
}

// ── Internal helpers ─────────────────────────────────────────────────────────

const imageCache = new Map<string, HTMLImageElement>();

function makePlaceholderImage(p: { url: string; width: number; height: number }): HTMLImageElement {
  // A bare HTMLImageElement that fires onLoad once decoded. Caching above
  // replaces it with the real image once available.
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = p.url;
  // Synchronously expose natural dims to the engine before decode finishes.
  Object.defineProperty(img, 'naturalWidth', { value: p.width, configurable: true });
  Object.defineProperty(img, 'naturalHeight', { value: p.height, configurable: true });
  return img;
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-7 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em]">
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-obsidian/60">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}
