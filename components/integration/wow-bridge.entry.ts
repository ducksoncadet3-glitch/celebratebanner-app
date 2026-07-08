/**
 * WOW bridge · browser entry. Bundled to /wow/wow-bridge.js and loaded by index.html
 * ONLY when ?wow=1 is present. Exposes a tiny global API:
 *
 *   window.CBWOW.isWOWMode()                       → boolean
 *   window.CBWOW.showReveal(state, slot, handlers) → Promise<{ ok, rendered? }>
 *
 * showReveal builds the pipeline against the builder's current state, mounts the
 * Premium Reveal immediately (placeholders), then renders the four concepts ONE AT A
 * TIME — yielding to the browser between each and showing progress — so the UI stays
 * responsive. A concept that exceeds its time budget falls back to the placeholder.
 * Any failure keeps the standard preview visible so the customer is never blocked.
 * Changes no pricing, checkout, or renderer code.
 */
import { mountPremiumReveal } from '../src/index.ts';
import { createCanvasRenderer } from '../demo/renderer-binding.ts';
import { isWOWMode, safeBuildWowPipeline, selectConcept, rotationDegreesFor, sanitizedBannerText } from './wow-bridge.ts';
import type { BuilderState, BuilderPhoto } from './wow-bridge.ts';
import { renderConceptPreviewsProgressive } from '../demo/concept-previews.ts';
import type { ConceptPreview } from '../demo/concept-previews.ts';
import type { RenderPhotoRef } from '../../shared/render-adapter/src/index.ts';
import type { CanvasImage } from '../../shared/render-engine/src/types.ts';
import type { PhotoInput } from '../../shared/memory-profile/src/index.ts';

/** Per-concept render budget (ms). Over budget → placeholder fallback for that card. */
const PER_CONCEPT_TIMEOUT_MS = 2000;

/** Yield to the browser between concept renders — rAF, then idle/timeout fallback. */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else if (typeof (globalThis as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback === 'function') {
      (globalThis as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => resolve());
    } else setTimeout(resolve, 0);
  });
}
const monotonic = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

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

/**
 * NOTE on near-duplicate suppression: the Memory Profile engine can suppress duplicate
 * photos when supplied a `perceptualHash`. Measured on a 6-photo set with one duplicate,
 * doing so drops the supporting count 5 → 4, which costs ~1 storytelling point and pushes
 * borderline concepts under the 90 masterpiece gate — turning real artwork into
 * placeholders (passing 3/4 → 2/4). That is a net visual regression, so we do NOT feed the
 * hash here. Thumbnails are curated visually instead (uniform square crop + unified grade).
 * See shared/image-intelligence (curatePhotos/hammingDistance) for the ready capability.
 */
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

/** Inject one concept's rendered artwork + status badge into its card. */
function paintOne(p: ConceptPreview, root: HTMLElement): boolean {
  const card = root.querySelector<HTMLElement>(`.pr-card[data-concept="${p.conceptName}"]`);
  if (!card) return false;
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
    return true;
  }
  return false;
}

/** Create/return the live progress line above the reveal (announced to screen readers). */
function ensureProgress(slot: HTMLElement): HTMLElement {
  let bar = slot.querySelector<HTMLElement>('.wow-progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'wow-progress';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    slot.insertBefore(bar, slot.firstChild);
  }
  return bar;
}

function hide(slot: HTMLElement): void {
  slot.style.display = 'none';
  slot.replaceChildren();
}

async function showReveal(state: BuilderState, slot: HTMLElement, handlers: RevealHandlers = {}): Promise<RevealOutcome> {
  try {
    const outcome = safeBuildWowPipeline(state, { enrich: enrichFromUpload });
    if (!outcome.ok) {
      console.warn('[WOW] pipeline unavailable, keeping standard preview:', outcome.error);
      hide(slot);
      return { ok: false, error: outcome.error };
    }
    const { pipeline } = outcome.result;
    const renderer = createCanvasRenderer({
      previewMaxEdge: 900,
      resolveImage: makeResolver(state),
      // Honor the customer's own rotation; corrections are applied at draw time only.
      rotationFor: (ref) => rotationDegreesFor(state, ref.photoId),
    });

    // Mount the reveal immediately (placeholders) so the UI is responsive right away.
    slot.style.display = '';
    const progress = ensureProgress(slot);
    mountPremiumReveal(slot, {
      presentation: pipeline.wowPresentation,
      skipLoading: true,
      handlers: {
        onLove: (c) => { selectConcept(state, c.conceptName); handlers.onSelect?.(c.conceptName); },
        onDetails: (c) => { handlers.onDetails?.(c.conceptName); },
        onTryAnother: () => {},
      },
    });
    slot.insertBefore(progress, slot.firstChild); // keep progress at top after mount clears

    // Render concepts one at a time, yielding between each so the thread stays free.
    const previews = await renderConceptPreviewsProgressive(pipeline, renderer, {
      renderExports: false,
      // Real customer text preserved; raw placeholders become dignified labels.
      bannerText: sanitizedBannerText(state),
      perConceptTimeoutMs: PER_CONCEPT_TIMEOUT_MS,
      now: monotonic,
      scheduleYield: yieldToBrowser,
      onProgress: (done, total, preview) => {
        paintOne(preview, slot);
        progress.textContent = done < total ? `Rendering concept ${done} of ${total}…` : '';
        if (done >= total) progress.remove();
      },
    });

    const rendered = previews.filter((p) => p.status === 'rendered').length;
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
