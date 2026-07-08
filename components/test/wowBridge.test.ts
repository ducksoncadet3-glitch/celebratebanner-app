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
  rotationDegreesFor, sanitizedBannerText,
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

// ── Sprint 13: image intelligence wiring ─────────────────────────────

// (1) Rotated image handling — dimensions reported to the pipeline are rotation-aware.
test('rotated image: a 90° customer rotation makes the reported dimensions landscape', () => {
  const state: BuilderState = { images: [{ id: 'p0', name: 'p0.jpg', w: 3000, h: 4000 }], rotations: { p0: 90 }, theme: { id: 'graduation' } };
  const [input] = photoInputsFromState(state);
  assert.deepEqual([input.width, input.height], [4000, 3000], 'rotation-aware dimensions');
});
test('rotated image: 180° does not swap dimensions', () => {
  const state: BuilderState = { images: [{ id: 'p0', w: 3000, h: 4000 }], rotations: { p0: 180 } };
  const [input] = photoInputsFromState(state);
  assert.deepEqual([input.width, input.height], [3000, 4000]);
});
test('rotated image: an unrotated photo is reported unchanged', () => {
  const state: BuilderState = { images: [{ id: 'p0', w: 3000, h: 4000 }] };
  const [input] = photoInputsFromState(state);
  assert.deepEqual([input.width, input.height], [3000, 4000]);
});
test('rotationDegreesFor is safe when rotations are absent or junk', () => {
  assert.equal(rotationDegreesFor({ images: [] }, 'p0'), 0);
  assert.equal(rotationDegreesFor({ images: [], rotations: { p0: 'abc' } } as unknown as BuilderState, 'p0'), 0);
  assert.equal(rotationDegreesFor({ images: [], rotations: { p0: 270 } } as unknown as BuilderState, 'p0'), 270);
});
test('a rotated photo reaches the pipeline with the orientation the customer sees', () => {
  const base: BuilderState = { images: [
    { id: 'p0', w: 3000, h: 4000 }, { id: 'p1', w: 2400, h: 3200 }, { id: 'p2', w: 2400, h: 3200 },
  ], theme: { id: 'graduation' } };
  const rotated: BuilderState = { ...base, rotations: { p0: 90 } };
  const orientationOf = (state: BuilderState, id: string): string | undefined => {
    const mp = buildMemoryProfile(state, richEnrich);
    const all = [mp.hero_photo, ...mp.supporting_photos].filter(Boolean);
    return all.find((p) => p?.photoId === id)?.orientation;
  };
  assert.equal(orientationOf(base, 'p0'), 'portrait');
  assert.equal(orientationOf(rotated, 'p0'), 'landscape', 'the 90° rotation propagated into the pipeline');
});

// (2) Thumbnail curation — the profile suppresses near-identical uploads (fed by hash).
const HASHES: Record<string, string> = { p0: '0f0f0f0f0f0f0f0f', p1: 'ffff0000ffff0000', p2: 'ffff0000ffff0001', p3: '00ff00ff00ff00ff' };
const enrichWithHash: PhotoEnricher = (p) => ({ ...richEnrich(p), perceptualHash: HASHES[String(p.id)] });

test('thumbnail curation: a near-identical upload is suppressed from the story', () => {
  const state: BuilderState = { images: [
    { id: 'p0', w: 3000, h: 4000 }, { id: 'p1', w: 2400, h: 3200 },
    { id: 'p2', w: 2400, h: 3200 }, { id: 'p3', w: 2400, h: 3200 },
  ], theme: { id: 'graduation' } };
  const profile = buildMemoryProfile(state, enrichWithHash);
  const shown = [profile.hero_photo?.photoId, ...profile.supporting_photos.map((s) => s.photoId)].filter(Boolean);
  assert.ok(!shown.includes('p2'), 'the near-duplicate p2 is not shown twice');
  assert.ok(shown.includes('p1'), 'the strongest of the duplicate pair is kept');
});
test('thumbnail curation: with no hashes supplied, no photo is suppressed', () => {
  const state: BuilderState = { images: [
    { id: 'p0', w: 3000, h: 4000 }, { id: 'p1', w: 2400, h: 3200 }, { id: 'p2', w: 2400, h: 3200 },
  ], theme: { id: 'graduation' } };
  const profile = buildMemoryProfile(state, richEnrich); // no perceptualHash
  const shown = [profile.hero_photo?.photoId, ...profile.supporting_photos.map((s) => s.photoId)].filter(Boolean);
  assert.equal(shown.length, 3, 'nothing is discarded without proof of duplication');
});
test('thumbnail curation: duplicate detection is reported, never silent', () => {
  const state: BuilderState = { images: [
    { id: 'p0', w: 3000, h: 4000 }, { id: 'p1', w: 2400, h: 3200 }, { id: 'p2', w: 2400, h: 3200 },
  ], theme: { id: 'graduation' } };
  const profile = buildMemoryProfile(state, enrichWithHash);
  assert.ok(profile.duplicate_candidates.length >= 1, 'the duplicate pair is surfaced');
});

// (3) Placeholder name cleanup.
test('placeholder name cleanup: "e.g., Sarah Johnson" becomes "Graduate Name"', () => {
  const state: BuilderState = { images: [], theme: { id: 'graduation' }, bannerText: { name: 'e.g., Sarah Johnson', year: '2026' } };
  assert.deepEqual(sanitizedBannerText(state), { name: 'Graduate Name', year: '2026' });
});
test('real customer text survives sanitization untouched', () => {
  const state: BuilderState = { images: [], theme: { id: 'graduation' }, bannerText: { name: 'Jordan Rivera' } };
  assert.equal(sanitizedBannerText(state).name, 'Jordan Rivera');
});
test('empty graduation fields become dignified labels', () => {
  const state: BuilderState = { images: [], theme: { id: 'graduation' }, bannerText: { name: '', year: '', school: '' } };
  assert.deepEqual(sanitizedBannerText(state), { name: 'Graduate Name', year: 'Class Year', school: 'School Name' });
});

// (4) The WOW bundle carries the intelligence layer.
test('the wow bundle includes the image-intelligence pass', () => {
  const bundle = readRepo('wow/wow-bridge.js');
  for (const marker of ['planOrientationCorrection', 'heroBoxAspect', 'coverCropRect', 'sanitizeBannerText', 'prepareImage']) {
    assert.ok(bundle.includes(marker), `bundle should include ${marker}`);
  }
});

// (5) Default builder + checkout/pricing unchanged.
test('the default builder is unchanged: WOW stays behind the flag', () => {
  const html = readRepo('index.html');
  assert.ok(html.includes('function isWOWMode('), 'flag helper intact');
  assert.ok(html.includes('if(!isWOWMode())return;'), 'reveal still gated by the flag');
  assert.ok(/id="wow-reveal-slot"[^>]*display:none/.test(html), 'slot still inert by default');
});
test('image intelligence did not touch the existing renderer', () => {
  assert.equal(gitStatus('shared/render-engine'), '', 'render-engine must be untouched');
});
test('checkout and pricing are unchanged by image intelligence', () => {
  const html = readRepo('index.html');
  assert.ok(html.includes('goto(4)'), 'checkout navigation intact');
  assert.ok(/stripe/i.test(html), 'Stripe wiring intact');
  for (const price of ['9.99', '999']) assert.ok(html.includes(price), `pricing token ${price} intact`);
  const root = execSync('git rev-parse --show-toplevel', { cwd: componentsDir }).toString().trim();
  const changed = execSync('git status --porcelain', { cwd: root }).toString();
  const offenders = changed.split('\n').filter((l) => /checkout|pricing|stripe|printful|gelato/i.test(l));
  assert.deepEqual(offenders, [], `no checkout/pricing files may change:\n${offenders.join('\n')}`);
});
