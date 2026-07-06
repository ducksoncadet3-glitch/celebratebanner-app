/**
 * Premium Reveal demo — bundle entry (source).
 *
 * Imports the real Premium Reveal components + the five WOW Engine fixtures and
 * wires a simple fixture selector. Bundled to `premium-reveal-demo.js` (self-
 * contained IIFE) so the page runs from a plain <script> with no backend.
 *
 * Regenerate:  npx esbuild demo/premium-reveal-demo.entry.ts \
 *                --bundle --format=iife --platform=browser \
 *                --outfile=demo/premium-reveal-demo.js
 */
import { mountPremiumReveal } from '../src/index.ts';
import type { WowPresentation, WowConcept } from '../src/index.ts';

// Fixtures are inlined into the bundle (no fetch / no server needed).
import graduation from '../../shared/wow-engine/fixtures/graduation.json';
import championship from '../../shared/wow-engine/fixtures/championship.json';
import family from '../../shared/wow-engine/fixtures/family.json';
import wedding from '../../shared/wow-engine/fixtures/wedding.json';
import memorial from '../../shared/wow-engine/fixtures/memorial.json';

const FIXTURES: Record<string, WowPresentation> = {
  graduation: graduation as unknown as WowPresentation,
  championship: championship as unknown as WowPresentation,
  family: family as unknown as WowPresentation,
  wedding: wedding as unknown as WowPresentation,
  memorial: memorial as unknown as WowPresentation,
};

function toast(msg: string): void {
  let el = document.getElementById('demo-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'demo-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  window.clearTimeout((toast as unknown as { _t?: number })._t);
  (toast as unknown as { _t?: number })._t = window.setTimeout(() => el!.classList.remove('show'), 2200);
}

function render(key: string, skipLoading: boolean): void {
  const host = document.getElementById('reveal');
  if (!host) return;
  mountPremiumReveal(host, {
    presentation: FIXTURES[key]!,
    skipLoading,
    loadingIntervalMs: 650,
    onRevealed: () => toast(`Revealed: ${key}`),
    handlers: {
      onLove: (c: WowConcept) => toast(`❤ Loved: ${c.conceptName}`),
      onDetails: (c: WowConcept) => toast(`🔍 Details: ${c.conceptName}`),
      onTryAnother: (c: WowConcept) => toast(`↻ Try another than: ${c.conceptName}`),
    },
  });
}

function init(): void {
  const sel = document.getElementById('fixture') as HTMLSelectElement | null;
  const replay = document.getElementById('replay');
  const skip = document.getElementById('skip');
  const current = (): string => (sel ? sel.value : 'graduation');
  sel?.addEventListener('change', () => render(current(), false));
  replay?.addEventListener('click', () => render(current(), false));
  skip?.addEventListener('click', () => render(current(), true));
  render(current(), false);
}

if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
