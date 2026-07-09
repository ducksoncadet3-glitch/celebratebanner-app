/**
 * Sprint 8 — Real Preview Rendering tests. Node's built-in runner:
 *   node --test 'test/*.test.ts'
 *
 * The canvas binding itself needs a DOM, so these exercise the pure orchestration
 * (concept-previews.ts) with fake renderers — a success renderer, a throwing renderer
 * (fallback), and an empty-image renderer — plus git guards proving no production /
 * checkout / pricing / index.html changes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runPipeline } from '../demo/pipeline.ts';
import type { MemoryProfile } from '../demo/pipeline.ts';
import { renderConceptPreview, renderAllConceptPreviews, renderConceptPreviewsProgressive } from '../demo/concept-previews.ts';
import type { Renderer, RenderRequest, RenderedImage } from '../../shared/render-adapter/src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(here, '..');
const mpDir = join(componentsDir, '..', 'shared', 'memory-profile', 'fixtures');
const CONCEPTS = ['Signature Edition', 'Luxury Gold', 'Family Legacy', 'Modern Editorial'];

const loadProfile = (k: string): MemoryProfile => JSON.parse(readFileSync(join(mpDir, `${k}.json`), 'utf8'));
const result = () => runPipeline(loadProfile('graduation'));

// ── Fake renderers (stand in for the browser canvas binding) ─────────
function successRenderer(): Renderer {
  return {
    render(req: RenderRequest): RenderedImage {
      return {
        targetId: req.targetId, kind: req.kind, format: req.kind === 'export' ? 'jpg' : 'png',
        widthPx: req.widthPx, heightPx: req.heightPx, colorMode: req.colorMode,
        uri: `data:fake/${req.kind}/${req.targetId}/${req.seed}`, byteSize: 2048, renderMs: 12,
      };
    },
  };
}
function throwingRenderer(): Renderer {
  return { render(): RenderedImage { throw new Error('renderer boom'); } };
}
function emptyImageRenderer(): Renderer {
  return {
    render(req: RenderRequest): RenderedImage {
      return { targetId: req.targetId, kind: req.kind, format: 'png', widthPx: 0, heightPx: 0, colorMode: req.colorMode, uri: '', byteSize: 0, renderMs: 0 };
    },
  };
}

// ── Successful render ────────────────────────────────────────────────
test('successful render: a concept reports status "rendered" with a preview uri', () => {
  const p = renderConceptPreview(result(), 'Signature Edition', successRenderer());
  assert.equal(p.status, 'rendered');
  assert.ok(p.previewUri && p.previewUri.length > 0);
  assert.ok(p.thumbnailUri && p.thumbnailUri.length > 0);
  assert.equal(p.renderStatus, 'completed');
  assert.deepEqual(p.reasons, []);
});
test('successful render works with export rendering enabled too', () => {
  const p = renderConceptPreview(result(), 'Signature Edition', successRenderer(), { renderExports: true });
  assert.equal(p.status, 'rendered');
});
test('successful render works with renderExports disabled (demo mode)', () => {
  const p = renderConceptPreview(result(), 'Signature Edition', successRenderer(), { renderExports: false });
  assert.equal(p.status, 'rendered');
});

// ── Four concepts rendered ───────────────────────────────────────────
test('all four concepts render successfully', () => {
  const previews = renderAllConceptPreviews(result(), successRenderer());
  assert.equal(previews.length, 4);
  assert.deepEqual(previews.map((p) => p.conceptName).sort(), [...CONCEPTS].sort());
  for (const p of previews) {
    assert.equal(p.status, 'rendered');
    assert.ok(p.previewUri);
  }
});
test('every concept gets its own distinct preview uri', () => {
  const uris = renderAllConceptPreviews(result(), successRenderer()).map((p) => p.previewUri);
  assert.equal(new Set(uris).size, 4);
});
test('all five fixtures render four concepts each', () => {
  for (const k of ['graduation', 'championship', 'family', 'wedding', 'memorial']) {
    const previews = renderAllConceptPreviews(runPipeline(loadProfile(k)), successRenderer());
    assert.equal(previews.length, 4);
    assert.ok(previews.every((p) => p.status === 'rendered'), `${k} should render all four`);
  }
});

// ── Fallback render (renderer fails → placeholder) ───────────────────
test('fallback render: a throwing renderer degrades to status "fallback"', () => {
  const p = renderConceptPreview(result(), 'Signature Edition', throwingRenderer());
  assert.equal(p.status, 'fallback');
  assert.equal(p.previewUri, null);
});
test('fallback render: all four concepts fall back when the renderer throws', () => {
  const previews = renderAllConceptPreviews(result(), throwingRenderer());
  assert.equal(previews.length, 4);
  assert.ok(previews.every((p) => p.status === 'fallback' && p.previewUri === null));
});
test('fallback render: an empty-image renderer also degrades to "fallback"', () => {
  const p = renderConceptPreview(result(), 'Signature Edition', emptyImageRenderer());
  assert.equal(p.status, 'fallback');
  assert.equal(p.previewUri, null);
  assert.ok(p.reasons.length >= 1);
});

// ── Failed (upstream planning error) ─────────────────────────────────
test('failed: an unplannable result reports status "failed" and never throws', () => {
  // A malformed pipeline result makes renderPlanForConcept throw internally.
  const broken = {} as unknown as ReturnType<typeof result>;
  const p = renderConceptPreview(broken, 'Signature Edition', successRenderer());
  assert.equal(p.status, 'failed');
  assert.equal(p.previewUri, null);
  assert.ok(p.reasons.length >= 1);
});

// ── Progressive (non-blocking) rendering + per-concept timeout ───────
test('progressive render returns all four previews, in canonical order', async () => {
  const previews = await renderConceptPreviewsProgressive(result(), successRenderer());
  assert.equal(previews.length, 4);
  assert.deepEqual(previews.map((p) => p.conceptName), ['Signature Edition', 'Luxury Gold', 'Family Legacy', 'Modern Editorial']);
  assert.ok(previews.every((p) => p.status === 'rendered'));
});
test('progressive render yields between every concept and reports progress', async () => {
  let yields = 0; const progress: number[] = [];
  await renderConceptPreviewsProgressive(result(), successRenderer(), {
    scheduleYield: () => { yields += 1; return Promise.resolve(); },
    onProgress: (done, total) => { progress.push(done); assert.equal(total, 4); },
  });
  assert.equal(yields, 4);              // one yield before each of the four renders
  assert.deepEqual(progress, [1, 2, 3, 4]);
});
test('per-concept timeout downgrades a slow render to a placeholder fallback', async () => {
  // Clock jumps 5000ms across each render → every concept blows the 2000ms budget.
  let t = 0;
  const previews = await renderConceptPreviewsProgressive(result(), successRenderer(), {
    perConceptTimeoutMs: 2000,
    now: () => (t += 5000),
  });
  assert.ok(previews.every((p) => p.status === 'fallback' && p.previewUri === null));
  assert.ok(previews[0].reasons.some((r) => /budget/i.test(r)));
});
test('a generous budget keeps renders (no false timeout)', async () => {
  let t = 0;
  const previews = await renderConceptPreviewsProgressive(result(), successRenderer(), {
    perConceptTimeoutMs: 2000,
    now: () => (t += 1), // ~1ms per render → well under budget
  });
  assert.ok(previews.every((p) => p.status === 'rendered'));
});
test('progressive render never throws even when the renderer fails', async () => {
  const previews = await renderConceptPreviewsProgressive(result(), throwingRenderer());
  assert.equal(previews.length, 4);
  assert.ok(previews.every((p) => p.status === 'fallback'));
});

// ── The demo binding is bundled ──────────────────────────────────────
test('the demo bundle includes the renderer binding and the existing render engine', () => {
  const bundle = readFileSync(join(componentsDir, 'demo', 'premium-reveal-demo.js'), 'utf8');
  for (const marker of ['createCanvasRenderer', 'renderConceptPreviewsProgressive', 'renderPreview', 'directArt']) {
    assert.ok(bundle.includes(marker), `bundle should include ${marker}`);
  }
});

// ── No production / checkout / pricing / index.html changes ──────────
function gitStatus(paths: string): string {
  const root = execSync('git rev-parse --show-toplevel', { cwd: componentsDir }).toString().trim();
  return execSync(`git status --porcelain -- ${paths}`, { cwd: root }).toString().trim();
}
test('the real-preview demo did not change index.html (Sprint 9 owns that intentionally)', () => {
  // Sprint 8's demo is self-contained; any index.html change must be purely additive
  // (the intentional Sprint 9 WOW hook), never a rewrite of existing lines.
  const root = execSync('git rev-parse --show-toplevel', { cwd: componentsDir }).toString().trim();
  const numstat = execSync('git diff --numstat -- index.html', { cwd: root }).toString().trim();
  if (numstat === '') return;
  const [, del] = numstat.split(/\s+/).map(Number);
  assert.ok(del <= 1, `index.html must be additive only, but ${del} lines were deleted`);
});
test('the alternate builder (bannercraft-app.html) is unchanged', () => {
  assert.equal(gitStatus('bannercraft-app.html'), '', 'bannercraft-app.html must not be modified');
});
test('no checkout / pricing / Stripe code exists to change, and none was added', () => {
  const root = execSync('git rev-parse --show-toplevel', { cwd: componentsDir }).toString().trim();
  const changed = execSync('git status --porcelain', { cwd: root }).toString();
  const offenders = changed.split('\n').filter((l) => /checkout|pricing|stripe|printful/i.test(l));
  assert.deepEqual(offenders, [], `no checkout/pricing/stripe/printful files may change:\n${offenders.join('\n')}`);
});
// Sprint 15 extends the renderer for the first time. The invariant is no longer
// "no diff at all" but "every existing line survives": the standard path is reached
// whenever `renderMode` is absent, so the default builder cannot regress.
test('the production render engine source is extended, never rewritten', () => {
  const root = execSync('git rev-parse --show-toplevel', { cwd: componentsDir }).toString().trim();
  const numstat = execSync('git diff --numstat -- shared/render-engine/src', { cwd: root }).toString().trim();
  for (const line of numstat.split('\n').filter(Boolean)) {
    const [, deleted, file] = line.split(/\s+/);
    assert.equal(deleted, '0', `${file}: ${deleted} line(s) deleted — renderer changes must be additive`);
  }
});
test('the render adapter source is unchanged (additive demo only)', () => {
  assert.equal(gitStatus('shared/render-adapter/src'), '', 'render-adapter must not be modified');
});
