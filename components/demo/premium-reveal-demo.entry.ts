/**
 * CelebrateBanner 2.0 — Integration Demo · bundle entry (source).
 *
 * Proves the FULL pipeline composes, live in the browser:
 *   Memory Profile → Creative Brief → WOW Engine → Render Orchestrator →
 *   Render Adapter → Existing Renderer → Premium Reveal
 *
 * The five Memory Profile fixtures are inlined; everything downstream (brief, WOW
 * presentation, render plan) is generated live by the real shared modules. Sprint 8
 * adds REAL preview rendering: each concept card is drawn by the existing render
 * engine (via the Render Adapter), with the placeholder kept as a graceful fallback.
 *
 * Regenerate the bundle:
 *   npx esbuild demo/premium-reveal-demo.entry.ts \
 *     --bundle --format=iife --platform=browser --outfile=demo/premium-reveal-demo.js
 */
import { mountPremiumReveal } from '../src/index.ts';
import { runPipeline, renderPlanForConcept } from './pipeline.ts';
import type { PipelineResult, RenderPlan, WowConcept, WowConceptName, MemoryProfile } from './pipeline.ts';
import { createCanvasRenderer } from './renderer-binding.ts';
import { renderConceptPreviewsProgressive } from './concept-previews.ts';
import type { ConceptPreview } from './concept-previews.ts';
import type { Renderer } from '../../shared/render-adapter/src/index.ts';

/** Yield to the browser between concept renders — rAF, then idle/timeout fallback. */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });
}
const monotonic = (): number => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// Memory Profiles are inlined into the bundle (no fetch / no server needed).
import graduation from '../../shared/memory-profile/fixtures/graduation.json';
import championship from '../../shared/memory-profile/fixtures/championship.json';
import family from '../../shared/memory-profile/fixtures/family.json';
import wedding from '../../shared/memory-profile/fixtures/wedding.json';
import memorial from '../../shared/memory-profile/fixtures/memorial.json';

const PROFILES: Record<string, MemoryProfile> = {
  graduation: graduation as unknown as MemoryProfile,
  championship: championship as unknown as MemoryProfile,
  family: family as unknown as MemoryProfile,
  wedding: wedding as unknown as MemoryProfile,
  memorial: memorial as unknown as MemoryProfile,
};

const $ = (id: string): HTMLElement | null => document.getElementById(id);

function toast(msg: string): void {
  let el = $('demo-toast');
  if (!el) { el = document.createElement('div'); el.id = 'demo-toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  window.clearTimeout((toast as unknown as { _t?: number })._t);
  (toast as unknown as { _t?: number })._t = window.setTimeout(() => el!.classList.remove('show'), 2200);
}

function jsonInto(id: string, obj: unknown): void {
  const el = $(id);
  if (el) el.textContent = JSON.stringify(obj, null, 2);
}

function row(label: string, value: string): HTMLElement {
  const r = document.createElement('div');
  r.className = 'pd-row';
  const k = document.createElement('span'); k.className = 'pd-key'; k.textContent = label;
  const v = document.createElement('span'); v.className = 'pd-val'; v.textContent = value;
  r.append(k, v);
  return r;
}

function renderPlanDetails(plan: RenderPlan): void {
  const host = $('plan-details');
  if (!host) return;
  host.innerHTML = '';
  const q = plan.qualityChecks;

  const head = document.createElement('div');
  head.className = 'pd-head';
  const h = document.createElement('h3'); h.textContent = 'Render Plan Details';
  const status = document.createElement('span');
  status.id = 'plan-status';
  status.className = `pd-status ${plan.accepted ? 'pd-status--ok' : 'pd-status--err'}`;
  status.textContent = plan.accepted ? 'ACCEPTED' : 'REJECTED';
  head.append(h, status);

  const hero = plan.heroPhoto ? `${plan.heroPhoto.photoId}${plan.heroPhoto.filename ? ` · ${plan.heroPhoto.filename}` : ''}` : '—';
  const facts = document.createElement('div');
  facts.className = 'pd-facts';
  facts.append(
    row('Concept', plan.conceptName),
    row('Arrangement', plan.renderInstructions.arrangement),
    row('Hero photo', hero),
    row('Supporting photos', String(plan.supportingPhotos.length)),
  );

  const targets = document.createElement('div');
  targets.className = 'pd-block';
  targets.innerHTML = `<div class="pd-sub">Export targets (${plan.exportTargets.length})</div>`;
  for (const t of plan.exportTargets) {
    const el = document.createElement('div');
    el.className = 'pd-target';
    el.textContent = `${t.label} — ${t.widthPx}×${t.heightPx}px @${t.dpi} · ${t.colorMode}${t.framed ? ' · framed' : ''}`;
    targets.appendChild(el);
  }

  const checks = document.createElement('div');
  checks.className = 'pd-block';
  checks.innerHTML = `<div class="pd-sub">Quality checks</div>`;
  const CHECKS: [string, boolean][] = [
    ['Hero photo', q.heroPhoto], ['Supporting photos', q.supportingPhotos],
    ['WOW score ≥ 90', q.wowScore], ['Masterpiece passed', q.masterpiecePassed],
    ['Layout recipe', q.layoutRecipeComplete], ['Typography recipe', q.typographyRecipeComplete],
    ['Export targets', q.exportTargetsDefined],
  ];
  const grid = document.createElement('div'); grid.className = 'pd-checks';
  for (const [label, ok] of CHECKS) {
    const c = document.createElement('span');
    c.className = `pd-check ${ok ? 'pd-check--ok' : 'pd-check--err'}`;
    c.textContent = `${ok ? '✓' : '✗'} ${label}`;
    grid.appendChild(c);
  }
  checks.appendChild(grid);

  host.append(head, facts, targets, checks);
  if (plan.qualityChecks.reasons.length) {
    const reasons = document.createElement('div');
    reasons.className = 'pd-block pd-reasons';
    reasons.innerHTML = `<div class="pd-sub">Rejection reasons</div>` + plan.qualityChecks.reasons.map((r) => `<div class="pd-reason">• ${r}</div>`).join('');
    host.appendChild(reasons);
  }
}

let CURRENT: PipelineResult | null = null;

// The renderer binding is created lazily and reused; if the browser can't provide a
// canvas the whole reveal simply falls back to placeholders.
let RENDERER: Renderer | null = null;
let RENDERER_TRIED = false;
function getRenderer(): Renderer | null {
  if (!RENDERER_TRIED) {
    RENDERER_TRIED = true;
    try { RENDERER = createCanvasRenderer({ previewMaxEdge: 900 }); } catch { RENDERER = null; }
  }
  return RENDERER;
}

const STATUS_LABEL: Record<ConceptPreview['status'], string> = {
  rendered: 'RENDERED', fallback: 'FALLBACK', failed: 'FAILED',
};

/** Paint one concept's artwork + badge into its card. */
function paintCard(p: ConceptPreview): boolean {
  const card = document.querySelector<HTMLElement>(`.pr-card[data-concept="${p.conceptName}"]`);
  if (!card) return false;
  const media = card.querySelector<HTMLElement>('.pr-card-media');
  const previewEl = card.querySelector<HTMLElement>('.pr-card-preview');
  if (media) {
    let badge = media.querySelector<HTMLElement>('.pr-render-status');
    if (!badge) { badge = document.createElement('span'); badge.className = 'pr-render-status'; media.appendChild(badge); }
    badge.textContent = STATUS_LABEL[p.status];
    badge.className = `pr-render-status pr-render-status--${p.status}`;
    badge.title = p.reasons.join(' ') || `${p.status} (${p.renderTime}ms)`;
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

/** Render concepts ONE AT A TIME (non-blocking), painting + reporting progress. */
async function paintPreviews(result: PipelineResult): Promise<void> {
  const renderer = getRenderer();
  const total = result.wowPresentation.concepts.length;
  const summary = $('render-summary');
  const setSummary = (text: string, state: string): void => {
    if (summary) { summary.textContent = text; summary.dataset.state = state; }
  };

  if (!renderer) {
    for (const c of result.wowPresentation.concepts) {
      paintCard({ conceptName: c.conceptName, status: 'fallback', previewUri: null, thumbnailUri: null, renderStatus: 'error', renderTime: 0, reasons: ['No canvas available in this environment.'] });
    }
    setSummary(`Rendered 0/${total} concepts · placeholder fallback`, 'fallback');
    return;
  }

  const previews = await renderConceptPreviewsProgressive(result, renderer, {
    renderExports: false,
    perConceptTimeoutMs: 2000,
    now: monotonic,
    scheduleYield: yieldToBrowser,
    onProgress: (done, t, preview) => {
      paintCard(preview);
      if (done < t) setSummary(`Rendering concept ${done} of ${t}…`, 'partial');
    },
  });

  const rendered = previews.filter((p) => p.status === 'rendered').length;
  setSummary(
    rendered === total ? `Real artwork rendered for all ${total} concepts` : `Rendered ${rendered}/${total} concepts · ${total - rendered} on placeholder fallback`,
    rendered === total ? 'ok' : (rendered === 0 ? 'fallback' : 'partial'),
  );
}

function render(key: string, skipLoading: boolean, focusConcept?: WowConceptName): void {
  const mp = PROFILES[key]!;
  const result = runPipeline(mp);           // ← the full pipeline runs here, live
  CURRENT = result;

  // Pipeline stage panels (raw outputs of each engine).
  jsonInto('stage-mp', result.memoryProfile);
  jsonInto('stage-cb', result.creativeBrief);
  jsonInto('stage-wp', result.wowPresentation);
  jsonInto('stage-plan', result.renderPlan);

  // Render Plan Details for the focused concept (default: the recommended one).
  renderPlanDetails(focusConcept ? renderPlanForConcept(result, focusConcept) : result.renderPlan);

  const host = $('reveal');
  if (host) {
    mountPremiumReveal(host, {
      presentation: result.wowPresentation,
      skipLoading,
      loadingIntervalMs: 650,
      onRevealed: () => { toast(`Revealed: ${key}`); paintPreviews(result); },
      handlers: {
        onLove: (c: WowConcept) => { focus(c); toast(`❤ Loved: ${c.conceptName}`); },
        onDetails: (c: WowConcept) => { focus(c); toast(`🔍 Render plan: ${c.conceptName}`); },
        onTryAnother: (c: WowConcept) => toast(`↻ Try another than: ${c.conceptName}`),
      },
    });
  }
}

function focus(concept: WowConcept): void {
  if (CURRENT) renderPlanDetails(renderPlanForConcept(CURRENT, concept.conceptName));
}

function init(): void {
  const sel = $('fixture') as HTMLSelectElement | null;
  const current = (): string => (sel ? sel.value : 'graduation');
  sel?.addEventListener('change', () => render(current(), false));
  $('replay')?.addEventListener('click', () => render(current(), false));
  $('skip')?.addEventListener('click', () => render(current(), true));
  render(current(), false);
}

if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
