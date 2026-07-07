/**
 * WOW bridge · browser entry (Sprint 9). Bundled to /wow/wow-bridge.js and loaded by
 * index.html ONLY when ?wow=1 is present. Exposes a tiny global API:
 *
 *   window.CBWOW.isWOWMode()                       → boolean
 *   window.CBWOW.showReveal(state, slot, handlers) → { ok, rendered? }
 *
 * showReveal runs the pipeline against the builder's current state, mounts the
 * Premium Reveal into the given slot, and injects real rendered artwork per concept.
 * Any failure is caught and reported — the caller keeps the standard preview visible
 * so the customer is never blocked. It changes no pricing, checkout, or renderer code.
 */
import { mountPremiumReveal } from '../src/index.ts';
import { createCanvasRenderer } from '../demo/renderer-binding.ts';
import { isWOWMode, safeRunWowPipeline, selectConcept } from './wow-bridge.ts';
import type { BuilderState, BuilderPhoto } from './wow-bridge.ts';
import type { ConceptPreview } from '../demo/concept-previews.ts';
import type { RenderPhotoRef } from '../../shared/render-adapter/src/index.ts';
import type { CanvasImage } from '../../shared/render-engine/src/types.ts';
import type { PhotoInput } from '../../shared/memory-profile/src/index.ts';

/**
 * Sample genuinely pixel-derived quality signals from an uploaded image: mean
 * luminance (brightness), luminance spread (contrast), and Laplacian edge energy
 * (a sharpness proxy). All measured — nothing fabricated. Returns {} on any failure.
 */
function sampleSignals(el: unknown): Partial<PhotoInput> {
  try {
    const S = 48;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d');
    if (!ctx) return {};
    ctx.drawImage(el as CanvasImageSource, 0, 0, S, S);
    const d = ctx.getImageData(0, 0, S, S).data;
    const luma = new Float64Array(S * S);
    let sum = 0;
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
      const y = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      luma[p] = y; sum += y;
    }
    const mean = sum / (S * S);
    let varc = 0;
    for (let p = 0; p < luma.length; p++) { const dv = luma[p] - mean; varc += dv * dv; }
    const std = Math.sqrt(varc / luma.length);
    let edge = 0, n = 0;
    for (let y = 1; y < S - 1; y++) for (let x = 1; x < S - 1; x++) {
      const idx = y * S + x;
      const lap = 4 * luma[idx] - luma[idx - 1] - luma[idx + 1] - luma[idx - S] - luma[idx + S];
      edge += Math.abs(lap); n++;
    }
    const clamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
    return { brightness: clamp(mean / 255), contrast: clamp(std / 64), sharpness: clamp((n ? edge / n : 0) / 40) };
  } catch {
    return {};
  }
}

const enrichFromUpload = (photo: BuilderPhoto): Partial<PhotoInput> =>
  photo.imgEl ? sampleSignals(photo.imgEl) : {};

interface RevealHandlers {
  onSelect?: (conceptName: string) => void;
  onDetails?: (conceptName: string) => void;
}
interface RevealOutcome { ok: boolean; rendered?: number; error?: string }

const STATUS_LABEL: Record<ConceptPreview['status'], string> = {
  rendered: 'RENDERED', fallback: 'FALLBACK', failed: 'FAILED',
};

/** Resolve a photo reference to the customer's REAL uploaded <img> element. */
function makeResolver(state: BuilderState) {
  return (ref: RenderPhotoRef): CanvasImage | null => {
    const imgs = Array.isArray(state.images) ? state.images : [];
    const p = imgs.find((x) => String(x.id) === ref.photoId);
    const el = p && (p.imgEl as { width?: number } | undefined);
    return el && typeof el.width === 'number' && el.width > 0 ? (el as unknown as CanvasImage) : null;
  };
}

/** Inject rendered artwork + status badges into the mounted concept cards. */
function paintPreviews(previews: ConceptPreview[], root: HTMLElement): number {
  let rendered = 0;
  for (const p of previews) {
    const card = root.querySelector<HTMLElement>(`.pr-card[data-concept="${p.conceptName}"]`);
    if (!card) continue;
    const media = card.querySelector<HTMLElement>('.pr-card-media');
    const previewEl = card.querySelector<HTMLElement>('.pr-card-preview');
    if (media) {
      let badge = media.querySelector<HTMLElement>('.pr-render-status');
      if (!badge) { badge = document.createElement('span'); badge.className = 'pr-render-status'; media.appendChild(badge); }
      badge.textContent = STATUS_LABEL[p.status];
      badge.className = `pr-render-status pr-render-status--${p.status}`;
    }
    if (p.status === 'rendered' && p.previewUri && previewEl) {
      const img = document.createElement('img');
      img.className = 'pr-card-preview-img';
      img.alt = `${p.conceptName} preview`;
      img.src = p.previewUri;
      previewEl.replaceChildren(img);
      previewEl.classList.add('is-rendered');
      rendered += 1;
    }
  }
  return rendered;
}

function hide(slot: HTMLElement): void {
  slot.style.display = 'none';
  slot.replaceChildren();
}

function showReveal(state: BuilderState, slot: HTMLElement, handlers: RevealHandlers = {}): RevealOutcome {
  try {
    const renderer = createCanvasRenderer({ previewMaxEdge: 900, resolveImage: makeResolver(state) });
    const outcome = safeRunWowPipeline(state, renderer, { renderExports: false, enrich: enrichFromUpload });
    if (!outcome.ok) {
      console.warn('[WOW] pipeline unavailable, keeping standard preview:', outcome.error);
      hide(slot);
      return { ok: false, error: outcome.error };
    }
    const { pipeline, previews } = outcome.result;
    slot.style.display = '';
    mountPremiumReveal(slot, {
      presentation: pipeline.wowPresentation,
      skipLoading: true,
      handlers: {
        onLove: (c) => { selectConcept(state, c.conceptName); handlers.onSelect?.(c.conceptName); },
        onDetails: (c) => { handlers.onDetails?.(c.conceptName); },
        onTryAnother: () => {},
      },
      // onRevealed fires synchronously during mount — paint from the slot (which now
      // contains the reveal), not from mount's return value (still in its TDZ here).
      onRevealed: () => paintPreviews(previews, slot),
    });
    const rendered = paintPreviews(previews, slot);
    return { ok: true, rendered };
  } catch (err) {
    console.warn('[WOW] reveal failed, keeping standard preview:', err);
    hide(slot);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// Publish the tiny global API the builder calls behind the flag.
(window as unknown as { CBWOW?: unknown }).CBWOW = {
  isWOWMode: () => isWOWMode(typeof location !== 'undefined' ? location.search : ''),
  showReveal,
};
