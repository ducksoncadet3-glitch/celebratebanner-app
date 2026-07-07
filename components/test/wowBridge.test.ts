/**
 * Sprint 9 — Production Builder Integration (behind ?wow=1) tests.
 *   node --test 'test/*.test.ts'
 *
 * The bridge core is DOM-free, so the pipeline / fallback / selection logic is unit-
 * tested here with fake renderers. Guards prove index.html changes are limited and
 * intentional, checkout stays reachable, and no pricing/checkout/renderer files moved.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  isWOWMode, occasionForTheme, photoInputsFromState, buildMemoryProfile,
  runWowPipeline, safeRunWowPipeline, selectConcept,
} from '../integration/wow-bridge.ts';
import type { BuilderState, PhotoEnricher } from '../integration/wow-bridge.ts';
import type { Renderer, RenderRequest, RenderedImage } from '../../shared/render-adapter/src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(here, '..');
const repoRoot = () => execSync('git rev-parse --show-toplevel', { cwd: componentsDir }).toString().trim();
const readRepo = (rel: string) => readFileSync(join(repoRoot(), rel), 'utf8');

// ── Fakes ────────────────────────────────────────────────────────────
function successRenderer(): Renderer {
  return {
    render(r: RenderRequest): RenderedImage {
      return { targetId: r.targetId, kind: r.kind, format: 'png', widthPx: r.widthPx, heightPx: r.heightPx, colorMode: r.colorMode, uri: `data:fake/${r.kind}/${r.seed}`, byteSize: 512, renderMs: 4 };
    },
  };
}
function throwingRenderer(): Renderer {
  return { render(): RenderedImage { throw new Error('render boom'); } };
}
// A high-quality signal enricher → concepts clear the 90 gate → previews render.
const richEnrich: PhotoEnricher = () => ({ sharpness: 0.95, brightness: 0.55, contrast: 0.75 });

function demoState(n = 6): BuilderState {
  return {
    images: Array.from({ length: n }, (_, i) => ({ id: 'p' + i, name: `photo${i}.jpg`, w: i % 2 ? 6000 : 4032, h: i % 2 ? 4000 : 5040 })),
    heroImage: 'p0',
    theme: { id: 'graduation' },
    bannerText: { name: 'Jordan', year: '2026' },
    selectedPackage: 'digital',
    delivery: 'digital',
  };
}

// ── Feature flag detection ───────────────────────────────────────────
test('WOW mode activates ONLY with wow=1', () => {
  for (const s of ['?wow=1', '?a=2&wow=1', '?wow=1&b=3', 'wow=1']) assert.equal(isWOWMode(s), true, s);
});
test('default mode: wow flag absent or non-1 stays off', () => {
  for (const s of ['', '?', '?theme=graduation', '?wow=0', '?wow=2', '?wow=12', '?nowow=1', '?showwow=1']) {
    assert.equal(isWOWMode(s), false, s);
  }
});
test('isWOWMode never throws on odd input', () => {
  assert.equal(isWOWMode(undefined as unknown as string), false);
});

// ── Translation helpers ──────────────────────────────────────────────
test('occasionForTheme maps builder themes to pipeline occasions', () => {
  assert.equal(occasionForTheme('graduation'), 'graduation');
  assert.equal(occasionForTheme('champion'), 'championship');
  assert.equal(occasionForTheme('worldcup2026'), 'championship');
  assert.equal(occasionForTheme('wedding'), 'wedding');
  assert.equal(occasionForTheme('pets'), 'unknown');
  assert.equal(occasionForTheme(undefined), 'unknown');
});
test('photoInputsFromState maps dimensions + filename and drops invalid photos', () => {
  const state: BuilderState = { images: [
    { id: 'a', name: 'a.jpg', w: 4000, h: 3000 },
    { id: 'b', name: 'b.jpg', w: 0, h: 3000 },
    { id: 'c', w: 3000, h: 4000 },
  ] };
  const inputs = photoInputsFromState(state);
  assert.equal(inputs.length, 2);
  assert.deepEqual(inputs[0], { id: 'a', filename: 'a.jpg', width: 4000, height: 3000 });
});
test('photoInputsFromState applies the enricher when provided', () => {
  const inputs = photoInputsFromState(demoState(1), richEnrich);
  assert.equal(inputs[0].sharpness, 0.95);
  assert.equal(inputs[0].brightness, 0.55);
});
test('buildMemoryProfile yields a hero-anchored profile from builder state', () => {
  const mp = buildMemoryProfile(demoState(), richEnrich);
  assert.ok(mp.hero_photo);
  assert.equal(mp.occasion, 'graduation');
});

// ── Pipeline runs in WOW mode ────────────────────────────────────────
test('pipeline runs in WOW mode and produces four concept previews', () => {
  const out = safeRunWowPipeline(demoState(), successRenderer(), { enrich: richEnrich });
  assert.equal(out.ok, true);
  if (!out.ok) return;
  assert.equal(out.result.previews.length, 4);
  assert.equal(out.result.pipeline.wowPresentation.concepts.length, 4);
});
test('with good photo signals the recommended concept renders real artwork', () => {
  const out = runWowPipeline(demoState(), successRenderer(), { enrich: richEnrich });
  const rendered = out.previews.filter((p) => p.status === 'rendered');
  assert.ok(rendered.length >= 1, `expected at least one rendered concept, got ${out.previews.map((p) => p.status).join(',')}`);
  assert.ok(rendered.every((p) => p.previewUri && p.previewUri.length > 0));
});

// ── Fallback safety ──────────────────────────────────────────────────
test('failure falls back safely: no photos → ok:false, never throws', () => {
  const out = safeRunWowPipeline({ images: [] }, successRenderer(), { enrich: richEnrich });
  assert.equal(out.ok, false);
  if (out.ok) return;
  assert.match(out.error, /no uploaded photos/i);
});
test('failure falls back safely: a throwing renderer degrades every concept to fallback (still ok)', () => {
  const out = safeRunWowPipeline(demoState(), throwingRenderer(), { enrich: richEnrich });
  assert.equal(out.ok, true);
  if (!out.ok) return;
  assert.equal(out.result.previews.length, 4);
  assert.ok(out.result.previews.every((p) => p.status === 'fallback' && p.previewUri === null));
});
test('low-quality signals degrade to placeholder previews without error', () => {
  const out = safeRunWowPipeline(demoState(), successRenderer()); // no enrich → scores < 90
  assert.equal(out.ok, true);
  if (!out.ok) return;
  assert.ok(out.result.previews.every((p) => p.status !== 'rendered'));
});

// ── Concept selection ────────────────────────────────────────────────
test('selecting a concept updates state without touching pricing/checkout', () => {
  const state = demoState();
  const before = { selectedPackage: state.selectedPackage, delivery: state.delivery };
  selectConcept(state, 'Luxury Gold');
  assert.equal(state.wowSelectedConcept, 'Luxury Gold');
  assert.equal(state.selectedPackage, before.selectedPackage);
  assert.equal(state.delivery, before.delivery);
});

// ── Bundle present ───────────────────────────────────────────────────
test('the wow bridge bundle is built and exposes CBWOW', () => {
  const bundle = readRepo('wow/wow-bridge.js');
  for (const marker of ['CBWOW', 'showReveal', 'generateMemoryProfile', 'mountPremiumReveal', 'renderPreview']) {
    assert.ok(bundle.includes(marker), `bundle should include ${marker}`);
  }
});

// ── index.html: limited, intentional, guarded; checkout reachable ────
test('index.html integration is present and fully guarded behind the flag', () => {
  const html = readRepo('index.html');
  assert.ok(html.includes('function isWOWMode('), 'isWOWMode helper present');
  assert.ok(html.includes('id="wow-reveal-slot"'), 'mount slot present');
  assert.ok(html.includes("wow/wow-bridge.js"), 'bundle loader present');
  assert.ok(html.includes('if(!isWOWMode())return;'), 'reveal is guarded by the flag');
});
test('index.html changes are LIMITED and intentional (additive)', () => {
  const numstat = execSync('git diff --numstat -- index.html', { cwd: repoRoot() }).toString().trim();
  if (numstat === '') return; // already committed elsewhere; nothing to bound
  const [ins, del] = numstat.split(/\s+/).map(Number);
  assert.ok(del <= 1, `expected ≤1 deleted line in index.html, got ${del}`);
  assert.ok(ins <= 45, `expected a small additive change to index.html, got ${ins} insertions`);
});
test('checkout stays reachable and pricing is unchanged in index.html', () => {
  const html = readRepo('index.html');
  assert.ok(html.includes('goto(4)'), 'Continue-to-Delivery navigation intact');
  assert.ok(/stripe/i.test(html), 'Stripe checkout wiring intact');
  for (const price of ['9.99', '999']) assert.ok(html.includes(price), `pricing token ${price} intact`);
});

// ── No production / checkout / pricing / renderer file moves ─────────
function gitStatus(paths: string): string {
  return execSync(`git status --porcelain -- ${paths}`, { cwd: repoRoot() }).toString().trim();
}
test('no checkout / pricing / Stripe / Printful / Gelato files were changed', () => {
  const changed = execSync('git status --porcelain', { cwd: repoRoot() }).toString();
  const offenders = changed.split('\n').filter((l) => /checkout|pricing|stripe|printful|gelato/i.test(l));
  assert.deepEqual(offenders, [], `unexpected changes:\n${offenders.join('\n')}`);
});
test('the existing render engine and adapter sources are unchanged', () => {
  assert.equal(gitStatus('shared/render-engine/src'), '', 'render-engine unchanged');
  assert.equal(gitStatus('shared/render-adapter/src'), '', 'render-adapter unchanged');
});
