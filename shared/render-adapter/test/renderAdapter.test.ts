/**
 * Render Adapter tests. Node's built-in runner (no deps):
 *   node --test 'test/*.test.ts'
 *
 * Every plan is built by running the FULL pipeline (Memory Profile → Creative Brief
 * → WOW Engine → Render Orchestrator) so these tests prove the whole chain composes,
 * then drive the adapter with a deterministic, pixel-free stub renderer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateRenderPlan } from '../../render-orchestrator/src/index.ts';
import type { MemoryProfile, CreativeBrief, WowPresentation, RenderPlan, WowConceptName } from '../../render-orchestrator/src/types.ts';
import {
  renderConcept, buildRenderRequest, deriveSeed, scaleToLongEdge,
  validateRendered, imageValid, SCHEMA_VERSION, REQUIRED_EXPORT_TARGETS,
} from '../src/index.ts';
import type { RenderedConcept } from '../src/types.ts';
import { createStubRenderer, createThrowingRenderer, createEmptyImageRenderer } from './stub-renderer.ts';

const here = dirname(fileURLToPath(import.meta.url));
const mpDir = join(here, '..', '..', 'memory-profile', 'fixtures');
const cbDir = join(here, '..', '..', 'creative-brief', 'fixtures');
const wpDir = join(here, '..', '..', 'wow-engine', 'fixtures');
const fxDir = join(here, '..', 'fixtures');

const KEYS = ['graduation', 'championship', 'family', 'wedding', 'memorial'] as const;
type Key = (typeof KEYS)[number];
const load = (dir: string, k: Key) => JSON.parse(readFileSync(join(dir, `${k}.json`), 'utf8'));
const mp = (k: Key): MemoryProfile => load(mpDir, k);
const cb = (k: Key): CreativeBrief => load(cbDir, k);
const wp = (k: Key): WowPresentation => load(wpDir, k);
const fixture = (k: Key): RenderedConcept => load(fxDir, k);

/** Full pipeline → RenderPlan for a fixture key. */
const plan = (k: Key): RenderPlan => generateRenderPlan(mp(k), cb(k), wp(k));
/** RenderPlan → RenderedConcept via a fresh deterministic stub renderer. */
const render = (k: Key): RenderedConcept => renderConcept(plan(k), createStubRenderer());

const CONCEPT_FIELDS = [
  'schemaVersion', 'conceptName', 'occasion', 'arrangement', 'renderStatus',
  'renderTime', 'previewImage', 'thumbnailImage', 'exportTargets', 'qualityChecks',
];
const QC_FIELDS = [
  'passed', 'renderCompleted', 'previewExists', 'thumbnailExists',
  'exportTargetsAvailable', 'qualityChecksPassed', 'reasons',
];

const allImages = (c: RenderedConcept) =>
  [c.previewImage, c.thumbnailImage, ...c.exportTargets.map((e) => e.image)].filter((i) => i != null);

// ── Exports ──────────────────────────────────────────────────────────
test('SCHEMA_VERSION is exported as a string', () => assert.equal(typeof SCHEMA_VERSION, 'string'));
test('REQUIRED_EXPORT_TARGETS lists the four export ids', () => {
  assert.deepEqual([...REQUIRED_EXPORT_TARGETS].sort(), ['digital', 'framed_24x36', 'poster_18x24', 'poster_24x36']);
});

// ── Per-fixture families (all five fixtures) ─────────────────────────
for (const k of KEYS) {
  test(`[${k}] deep-equals its snapshot fixture`, () => assert.deepEqual(render(k), fixture(k)));
  test(`[${k}] is deterministic across runs`, () => assert.deepEqual(render(k), render(k)));
  test(`[${k}] has every RenderedConcept field`, () => {
    const c = render(k) as unknown as Record<string, unknown>;
    for (const f of CONCEPT_FIELDS) assert.ok(f in c, `missing ${f}`);
  });
  test(`[${k}] render completed`, () => assert.equal(render(k).renderStatus, 'completed'));
  test(`[${k}] preview image exists (valid RGB png)`, () => {
    const p = render(k).previewImage!;
    assert.ok(imageValid(p));
    assert.equal(p.format, 'png');
    assert.equal(p.colorMode, 'RGB');
    assert.equal(p.kind, 'preview');
  });
  test(`[${k}] thumbnail image exists (valid RGB png, smaller than preview)`, () => {
    const c = render(k);
    const t = c.thumbnailImage!;
    assert.ok(imageValid(t));
    assert.equal(t.format, 'png');
    assert.equal(t.kind, 'thumbnail');
    assert.ok(t.widthPx < c.previewImage!.widthPx);
  });
  test(`[${k}] renders all four export targets, each with a valid image`, () => {
    const ex = render(k).exportTargets;
    assert.equal(ex.length, 4);
    assert.deepEqual(ex.map((e) => e.id).sort(), ['digital', 'framed_24x36', 'poster_18x24', 'poster_24x36']);
    for (const e of ex) {
      assert.ok(imageValid(e.image), `${e.id} image invalid`);
      assert.equal(e.image.targetId, e.id);
      assert.equal(e.image.widthPx, e.widthPx);
      assert.equal(e.image.heightPx, e.heightPx);
      assert.equal(e.image.colorMode, e.colorMode);
    }
  });
  test(`[${k}] quality checks pass with no reasons`, () => {
    const q = render(k).qualityChecks;
    assert.equal(q.passed, true);
    assert.deepEqual(q.reasons, []);
    for (const f of QC_FIELDS) assert.ok(f in q, `missing ${f}`);
    for (const c of ['renderCompleted', 'previewExists', 'thumbnailExists', 'exportTargetsAvailable', 'qualityChecksPassed']) {
      assert.equal((q as unknown as Record<string, boolean>)[c], true, `${c} should be true`);
    }
  });
  test(`[${k}] renderTime equals the sum of every image's renderMs`, () => {
    const c = render(k);
    const sum = allImages(c).reduce((s, i) => s + i.renderMs, 0);
    assert.equal(c.renderTime, sum);
    assert.ok(c.renderTime > 0);
  });
  test(`[${k}] embeds NO pixels`, () => {
    const s = JSON.stringify(render(k)).toLowerCase();
    for (const bad of ['data:image', 'base64', '<canvas', '<svg', 'dataurl']) assert.ok(!s.includes(bad), `found ${bad}`);
  });
  test(`[${k}] arrangement + concept + occasion are carried from the plan`, () => {
    const p = plan(k);
    const c = render(k);
    assert.equal(c.arrangement, p.renderInstructions.arrangement);
    assert.equal(c.conceptName, p.conceptName);
    assert.equal(c.occasion, p.occasion);
    assert.equal(c.schemaVersion, SCHEMA_VERSION);
  });
  test(`[${k}] invokes the renderer exactly six times in order`, () => {
    const stub = createStubRenderer();
    renderConcept(plan(k), stub);
    assert.equal(stub.calls.length, 6);
    assert.deepEqual(stub.calls.map((r) => r.kind), ['preview', 'thumbnail', 'export', 'export', 'export', 'export']);
    assert.deepEqual(stub.calls.slice(2).map((r) => r.targetId), ['digital', 'poster_18x24', 'poster_24x36', 'framed_24x36']);
  });
  test(`[${k}] does not mutate the input plan`, () => {
    const p = plan(k);
    const before = structuredClone(p);
    renderConcept(p, createStubRenderer());
    assert.deepEqual(p, before);
  });
}

// ── buildRenderRequest — dimensions & translation fidelity ───────────
test('preview request is 800×1200 (portrait), 72 DPI, RGB png', () => {
  const req = buildRenderRequest(plan('graduation'), 'preview');
  assert.deepEqual([req.widthPx, req.heightPx], [800, 1200]);
  assert.equal(req.dpi, 72);
  assert.equal(req.colorMode, 'RGB');
  assert.deepEqual(req.formats, ['png']);
  assert.equal(req.targetId, 'preview');
});
test('thumbnail request is 267×400 (portrait aspect preserved)', () => {
  const req = buildRenderRequest(plan('graduation'), 'thumbnail');
  assert.deepEqual([req.widthPx, req.heightPx], [267, 400]);
  assert.equal(req.targetId, 'thumbnail');
});
test('export request carries the target dimensions, color mode, and formats', () => {
  const p = plan('graduation');
  const digital = p.exportTargets.find((t) => t.id === 'digital')!;
  const req = buildRenderRequest(p, 'export', digital);
  assert.deepEqual([req.widthPx, req.heightPx], [7200, 10800]);
  assert.equal(req.dpi, 300);
  assert.equal(req.colorMode, 'RGB');
  assert.deepEqual(req.formats, ['jpg', 'pdf']);
  assert.equal(req.targetId, 'digital');
});
test('export request without a target throws', () => {
  assert.throws(() => buildRenderRequest(plan('graduation'), 'export'), /export target is required/);
});
test('hero ref carries the plan hero photo, frame, and dominance ratio', () => {
  const p = plan('graduation');
  const req = buildRenderRequest(p, 'preview');
  assert.equal(req.hero!.photoId, p.heroPhoto!.photoId);
  assert.equal(req.hero!.role, 'hero');
  assert.equal(req.hero!.frame, p.renderInstructions.heroPlacement.frame);
  assert.equal(req.hero!.dominanceRatio, p.renderInstructions.heroPlacement.dominanceRatio);
});
test('supporting refs honor the plan cell count and default frame', () => {
  const p = plan('graduation');
  const req = buildRenderRequest(p, 'preview');
  assert.equal(req.supporting.length, p.renderInstructions.supportingPlacement.count);
  for (const s of req.supporting) {
    assert.equal(s.role, 'supporting');
    assert.equal(s.frame, null);
    assert.equal(s.dominanceRatio, null);
  }
});
test('theme spec carries the plan color palette (ground/accent/neutral/swatches)', () => {
  const p = plan('graduation');
  const cp = p.renderInstructions.colorPalette;
  const req = buildRenderRequest(p, 'preview');
  assert.equal(req.theme.ground, cp.ground);
  assert.equal(req.theme.accent, cp.accent);
  assert.equal(req.theme.neutral, cp.neutral);
  assert.equal(req.theme.source, cp.source);
  assert.equal(req.theme.swatches.length, cp.palette.length);
});
test('typography alignment is carried: magazine=left, signature=center', () => {
  const mag = buildRenderRequest(generateRenderPlan(mp('graduation'), cb('graduation'), wp('graduation'), { conceptName: 'Modern Editorial' }), 'preview');
  const ctr = buildRenderRequest(generateRenderPlan(mp('graduation'), cb('graduation'), wp('graduation'), { conceptName: 'Signature Edition' }), 'preview');
  assert.equal(mag.typography.alignment, 'left');
  assert.equal(ctr.typography.alignment, 'center');
});
test('background decoration theme is carried from the plan', () => {
  const p = plan('graduation');
  const req = buildRenderRequest(p, 'preview');
  assert.equal(req.background.decorationTheme, p.renderInstructions.backgroundSelection.decorationTheme);
  assert.equal(req.background.vignette, p.renderInstructions.backgroundSelection.vignette);
});
test('hero spotlight flag is carried from the plan (Luxury Gold=true)', () => {
  const lux = buildRenderRequest(generateRenderPlan(mp('championship'), cb('championship'), wp('championship'), { conceptName: 'Luxury Gold' }), 'preview');
  const sig = buildRenderRequest(generateRenderPlan(mp('championship'), cb('championship'), wp('championship'), { conceptName: 'Signature Edition' }), 'preview');
  assert.equal(lux.heroSpotlight, true);
  assert.equal(sig.heroSpotlight, false);
});
test('decorative elements are carried verbatim from the plan (nothing invented)', () => {
  const p = plan('graduation');
  const req = buildRenderRequest(p, 'preview');
  assert.deepEqual(req.decorativeElements, p.renderInstructions.decorativeElements);
});
test('layering order is carried verbatim from the plan', () => {
  const p = plan('graduation');
  const req = buildRenderRequest(p, 'preview');
  assert.deepEqual(req.layering, p.renderInstructions.layering.order);
});

// ── Seed & options ───────────────────────────────────────────────────
test('deriveSeed is deterministic and stable for a plan', () => {
  const p = plan('graduation');
  assert.equal(deriveSeed(p), deriveSeed(p));
  assert.equal(typeof deriveSeed(p), 'number');
});
test('deriveSeed differs across concepts', () => {
  const sig = generateRenderPlan(mp('graduation'), cb('graduation'), wp('graduation'), { conceptName: 'Signature Edition' });
  const mag = generateRenderPlan(mp('graduation'), cb('graduation'), wp('graduation'), { conceptName: 'Modern Editorial' });
  assert.notEqual(deriveSeed(sig), deriveSeed(mag));
});
test('the request seed defaults to deriveSeed(plan)', () => {
  const p = plan('graduation');
  assert.equal(buildRenderRequest(p, 'preview').seed, deriveSeed(p));
});
test('options.seed overrides the derived seed and changes the image uri', () => {
  const p = plan('graduation');
  const a = renderConcept(p, createStubRenderer());
  const b = renderConcept(p, createStubRenderer(), { seed: 123456 });
  assert.notEqual(a.previewImage!.uri, b.previewImage!.uri);
});
test('options.bannerText is threaded into every request', () => {
  const stub = createStubRenderer();
  renderConcept(plan('graduation'), stub, { bannerText: { name: 'Jordan', year: '2026' } });
  for (const req of stub.calls) assert.deepEqual(req.bannerText, { name: 'Jordan', year: '2026' });
});
test('bannerText defaults to empty when not supplied', () => {
  assert.deepEqual(buildRenderRequest(plan('graduation'), 'preview').bannerText, {});
});
test('options.previewLongEdge resizes the preview while keeping aspect', () => {
  const req = buildRenderRequest(plan('graduation'), 'preview', undefined, { previewLongEdge: 600 });
  assert.deepEqual([req.widthPx, req.heightPx], [400, 600]);
});
test('options.renderExports=false renders preview+thumbnail only', () => {
  const stub = createStubRenderer();
  const c = renderConcept(plan('graduation'), stub, { renderExports: false });
  assert.equal(stub.calls.length, 2);
  assert.equal(c.exportTargets.length, 0);
  assert.equal(c.qualityChecks.exportTargetsAvailable, false);
  assert.equal(c.qualityChecks.passed, false);
});

// ── scaleToLongEdge helper ───────────────────────────────────────────
test('scaleToLongEdge preserves aspect ratio to the long edge', () => {
  assert.deepEqual(scaleToLongEdge(7200, 10800, 1200), { width: 800, height: 1200 });
  assert.deepEqual(scaleToLongEdge(10800, 7200, 1200), { width: 1200, height: 800 });
  assert.deepEqual(scaleToLongEdge(1000, 1000, 400), { width: 400, height: 400 });
});
test('scaleToLongEdge guards against degenerate sizes', () => {
  const r = scaleToLongEdge(0, 0, 1200);
  assert.ok(r.width >= 1 && r.height >= 1);
});

// ── Rejected plans are skipped, not rendered ─────────────────────────
test('unaccepted plan (unknown concept) is skipped and never rendered', () => {
  const p = generateRenderPlan(mp('graduation'), cb('graduation'), wp('graduation'), { conceptName: 'Nope' as WowConceptName });
  assert.equal(p.accepted, false);
  const stub = createStubRenderer();
  const c = renderConcept(p, stub);
  assert.equal(c.renderStatus, 'skipped');
  assert.equal(stub.calls.length, 0);
  assert.equal(c.previewImage, null);
  assert.equal(c.thumbnailImage, null);
  assert.deepEqual(c.exportTargets, []);
  assert.equal(c.renderTime, 0);
  assert.equal(c.qualityChecks.passed, false);
  assert.equal(c.qualityChecks.qualityChecksPassed, false);
  assert.ok(c.qualityChecks.reasons.some((r) => /not accepted/i.test(r)));
});
test('unaccepted plan (missing hero) is skipped', () => {
  const w = structuredClone(wp('graduation'));
  w.concepts.find((c) => c.conceptName === w.recommendedConcept)!.heroPhoto = null;
  const p = generateRenderPlan(mp('graduation'), cb('graduation'), w);
  assert.equal(p.accepted, false);
  const c = renderConcept(p, createStubRenderer());
  assert.equal(c.renderStatus, 'skipped');
  assert.equal(c.qualityChecks.passed, false);
});
test('unaccepted plan (WOW score below 90) is skipped with a reason', () => {
  const w = structuredClone(wp('graduation'));
  w.concepts.find((c) => c.conceptName === w.recommendedConcept)!.wowScore = 70;
  const p = generateRenderPlan(mp('graduation'), cb('graduation'), w);
  const c = renderConcept(p, createStubRenderer());
  assert.equal(c.renderStatus, 'skipped');
  assert.ok(c.qualityChecks.reasons.length >= 1);
});

// ── Renderer failure modes ───────────────────────────────────────────
test('a throwing renderer yields renderStatus=failed and passed=false', () => {
  const c = renderConcept(plan('graduation'), createThrowingRenderer());
  assert.equal(c.renderStatus, 'failed');
  assert.equal(c.qualityChecks.renderCompleted, false);
  assert.equal(c.qualityChecks.passed, false);
  assert.ok(c.qualityChecks.reasons.some((r) => /did not complete/i.test(r)));
});
test('a renderer returning empty images fails validation', () => {
  const c = renderConcept(plan('graduation'), createEmptyImageRenderer());
  assert.equal(c.renderStatus, 'failed');
  assert.equal(c.qualityChecks.previewExists, false);
  assert.equal(c.qualityChecks.passed, false);
});

// ── Validator unit checks ────────────────────────────────────────────
test('imageValid rejects null, empty-uri, and zero-size images', () => {
  assert.equal(imageValid(null), false);
  assert.equal(imageValid({ targetId: 'x', kind: 'preview', format: 'png', widthPx: 0, heightPx: 10, colorMode: 'RGB', uri: 'u', byteSize: 1, renderMs: 1 }), false);
  assert.equal(imageValid({ targetId: 'x', kind: 'preview', format: 'png', widthPx: 10, heightPx: 10, colorMode: 'RGB', uri: '', byteSize: 1, renderMs: 1 }), false);
  assert.equal(imageValid({ targetId: 'x', kind: 'preview', format: 'png', widthPx: 10, heightPx: 10, colorMode: 'RGB', uri: 'u', byteSize: 0, renderMs: 1 }), false);
  assert.equal(imageValid({ targetId: 'x', kind: 'preview', format: 'png', widthPx: 10, heightPx: 10, colorMode: 'RGB', uri: 'u', byteSize: 1, renderMs: 1 }), true);
});
test('validateRendered flags a completed render with missing exports', () => {
  const p = plan('graduation');
  const good = renderConcept(p, createStubRenderer());
  const q = validateRendered(p, good.previewImage, good.thumbnailImage, [], 'completed');
  assert.equal(q.exportTargetsAvailable, false);
  assert.equal(q.passed, false);
});

// ── Snapshot equality is exact (uri included) ────────────────────────
test('preview and export uris are snapshot-stable', () => {
  const c = render('graduation');
  const fx = fixture('graduation');
  assert.equal(c.previewImage!.uri, fx.previewImage!.uri);
  assert.deepEqual(c.exportTargets.map((e) => e.image.uri), fx.exportTargets.map((e) => e.image.uri));
});
