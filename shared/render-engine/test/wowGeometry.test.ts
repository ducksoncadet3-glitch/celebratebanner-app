/**
 * Sprint 15 — WOW arrangement geometry.
 *
 * Two layers of proof:
 *   1. The pure geometry module (imported from src — it is dependency-free).
 *   2. The REAL renderer, driven through a recording RenderContext, so we can count
 *      exactly which photo was drawn how many times in each mode.
 *
 * Run:  npm test        (builds dist first, then node --test 'test/*.test.ts')
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import {
  wowLayoutFor, wowSupportingCount, heroShare, assertLayout, enforceHeroDominance,
  classicWowLayout, pyramidWowLayout, mosaicWowLayout, magazineWowLayout,
  WOW_SUPPORTING_CAP, HERO_SHARE_FLOOR,
} from '../src/arrangements/wow-geometry.ts';
// The built engine (dist) — its `.js` specifiers resolve to real files.
import { renderBanner } from '../dist/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const W = 600, H = 900, CT = 200;
const ARRANGEMENTS = ['classic', 'pyramid', 'mosaic', 'magazine'] as const;

// ── a recording 2D context ───────────────────────────────────────────
interface Draw { image: unknown; dw: number; dh: number }
function recordingCtx() {
  const draws: Draw[] = [];
  const grad = { addColorStop() {} };
  const ctx = new Proxy({} as Record<string, unknown>, {
    get(_t, prop: string) {
      if (prop === 'drawImage') {
        return (image: unknown, ...a: number[]) => {
          // both 5-arg and 9-arg forms; the destination size is the last two numbers
          draws.push({ image, dw: a[a.length - 2], dh: a[a.length - 1] });
        };
      }
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => grad;
      if (prop === 'measureText') return () => ({ width: 10 });
      // every other property is either a no-op method or a settable style field
      return () => undefined;
    },
    set() { return true; },
  });
  return { ctx, draws };
}

/** A photo whose `image` object is uniquely identifiable. */
const photo = (id: string) => ({ id, image: { id, width: 1000, height: 1000 } });
const makeInput = (arrangement: string, count: number, renderMode?: 'standard' | 'wow') => ({
  width: W, height: H, arrangement,
  theme: { id: 'graduation', fields: [], palette: { bg: '#0C0E14', accent: '#C9A84C', text: '#FAF8F3' } },
  bannerText: {}, photos: Array.from({ length: count }, (_, i) => photo('p' + i)),
  heroId: 'p0', frames: {}, defaultFrame: 'rounded', seed: 7, cinematicHero: true,
  ...(renderMode ? { renderMode } : {}),
});

/** Count how many times each photo id was drawn. */
function drawCounts(arrangement: string, photoCount: number, renderMode?: 'standard' | 'wow') {
  const { ctx, draws } = recordingCtx();
  renderBanner(ctx as never, makeInput(arrangement, photoCount, renderMode) as never);
  const counts = new Map<string, number>();
  for (const d of draws) {
    const id = (d.image as { id?: string } | null)?.id;
    if (typeof id === 'string') counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}
const supportingDraws = (c: Map<string, number>) => [...c].filter(([id]) => id !== 'p0');
const supportingTotal = (c: Map<string, number>) => supportingDraws(c).reduce((s, [, n]) => s + n, 0);

// ── 1) The defect: standard mode repeats; WOW mode does not ──────────
test('BEFORE (standard): Signature Edition tiles 4 photos across a 40-cell grid', () => {
  const c = drawCounts('classic', 5); // hero + 4 supporting
  assert.equal(supportingTotal(c), 40, 'the classic grid is 8×5 = 40 cells');
  assert.ok(supportingDraws(c).some(([, n]) => n > 1), 'photos are repeated to fill it');
});
test('AFTER (wow): Signature Edition draws each supporting photo exactly once', () => {
  const c = drawCounts('classic', 5, 'wow');
  assert.equal(supportingTotal(c), 4, 'four photos → four cells');
  for (const [id, n] of supportingDraws(c)) assert.equal(n, 1, `${id} drawn once`);
});
test('wow mode never repeats a supporting photo, in any arrangement', () => {
  for (const arr of ARRANGEMENTS) {
    for (const supporting of [2, 3, 4, 5, 6]) {
      const c = drawCounts(arr, supporting + 1, 'wow');
      for (const [id, n] of supportingDraws(c)) assert.equal(n, 1, `${arr}/${supporting}: ${id} drawn ${n}×`);
    }
  }
});
test('wow mode never draws more supporting photos than exist', () => {
  for (const arr of ARRANGEMENTS) {
    const c = drawCounts(arr, 4, 'wow'); // hero + 3 supporting
    assert.ok(supportingTotal(c) <= 3, `${arr} drew ${supportingTotal(c)} from 3 photos`);
  }
});
test('the hero is always drawn, exactly once, in wow mode', () => {
  for (const arr of ARRANGEMENTS) assert.equal(drawCounts(arr, 5, 'wow').get('p0'), 1, arr);
});

// ── 2) Supporting-photo count limits per concept ─────────────────────
test('supporting caps: Signature 6 · Luxury Gold 4 · Family Legacy 8 · Modern Editorial 5', () => {
  assert.equal(WOW_SUPPORTING_CAP.classic, 6);
  assert.equal(WOW_SUPPORTING_CAP.pyramid, 4);
  assert.equal(WOW_SUPPORTING_CAP.mosaic, 8);
  assert.equal(WOW_SUPPORTING_CAP.magazine, 5);
});
test('an abundant upload is capped, not tiled', () => {
  const caps: Record<string, number> = { classic: 6, pyramid: 4, mosaic: 8, magazine: 5 };
  for (const arr of ARRANGEMENTS) {
    const c = drawCounts(arr, 21, 'wow'); // hero + 20 supporting
    assert.equal(supportingTotal(c), caps[arr], `${arr} should draw exactly ${caps[arr]}`);
    for (const [, n] of supportingDraws(c)) assert.equal(n, 1);
  }
});
test('wowSupportingCount never exceeds what exists, and never exceeds the cap', () => {
  assert.equal(wowSupportingCount('classic', 20), 6);
  assert.equal(wowSupportingCount('classic', 2), 2);
  assert.equal(wowSupportingCount('pyramid', 9), 4);
  assert.equal(wowSupportingCount('mosaic', 3), 3);
  assert.equal(wowSupportingCount('magazine', 100), 5);
  assert.equal(wowSupportingCount('unknown', 100), 6);
  assert.equal(wowSupportingCount('classic', 0), 0);
});

// ── 3) Hero dominance ────────────────────────────────────────────────
test('the hero commands the majority of drawn photo area in every layout', () => {
  for (const arr of ARRANGEMENTS) {
    for (let n = 2; n <= WOW_SUPPORTING_CAP[arr]; n++) {
      const share = heroShare(wowLayoutFor(arr, W, H, CT, n));
      assert.ok(share >= HERO_SHARE_FLOOR, `${arr}/${n}: hero share ${share.toFixed(3)} < ${HERO_SHARE_FLOOR}`);
    }
  }
});
test('HERO_SHARE_FLOOR is 55%', () => assert.equal(HERO_SHARE_FLOOR, 0.55));
test('in wow mode the hero is drawn larger than any supporting cell', () => {
  for (const arr of ARRANGEMENTS) {
    const L = wowLayoutFor(arr, W, H, CT, 4);
    const heroArea = L.hero.w * L.hero.h;
    for (const c of L.cells) assert.ok(heroArea > c.w * c.h * 2, `${arr}: hero must dwarf a supporting cell`);
  }
});
test('Signature Edition leaves no dead space between hero and strip', () => {
  const L = classicWowLayout(W, H, CT, 4);
  const gap = L.cells[0].y - (L.hero.y + L.hero.h);
  assert.ok(gap >= 0 && gap <= 40, `gap between hero and strip was ${gap}px`);
  assert.ok(L.hero.h > 360, 'the hero grows into the space the old 40-cell grid used to waste');
});

// ── 4) Layout character per concept ──────────────────────────────────
test('Signature Edition: one clean centred strip', () => {
  const L = classicWowLayout(W, H, CT, 5);
  assert.equal(L.cells.length, 5);
  assert.equal(new Set(L.cells.map((c) => Math.round(c.y))).size, 1, 'a single row');
});
test('Luxury Gold: sparse widening rows, at most four frames', () => {
  const L = pyramidWowLayout(W, H, CT, 4);
  assert.equal(L.cells.length, 4);
  assert.ok(new Set(L.cells.map((c) => Math.round(c.y))).size >= 2, 'more than one tier');
});
test('Family Legacy: layered above and below the hero', () => {
  const L = mosaicWowLayout(W, H, CT, 6);
  assert.equal(L.cells.length, 6);
  const above = L.cells.filter((c) => c.y < L.hero.y).length;
  const below = L.cells.filter((c) => c.y > L.hero.y).length;
  assert.ok(above > 0 && below > 0, 'memories gather on both sides of the hero');
});
test('Modern Editorial: one magazine row with negative space beside the hero', () => {
  const L = magazineWowLayout(W, H, CT, 3);
  assert.equal(L.cells.length, 3);
  assert.equal(new Set(L.cells.map((c) => Math.round(c.y))).size, 1, 'a single row');
  assert.ok(L.hero.x + L.hero.w < W - 40, 'negative space remains to the right of the hero');
});
test('a layout with zero supporting photos is still valid (hero only)', () => {
  for (const arr of ARRANGEMENTS) {
    const c = drawCounts(arr, 1, 'wow');
    assert.equal(c.get('p0'), 1);
    assert.equal(supportingTotal(c), 0);
  }
});

// ── 5) Fallback safety ───────────────────────────────────────────────
test('degenerate geometry throws so the renderer can fall back', () => {
  assert.throws(() => wowLayoutFor('classic', 60, 60, 10, 4), /degenerate|dominant/i);
  assert.throws(() => wowLayoutFor('scattered', W, H, CT, 4), /no intentional layout/i);
});
test('assertLayout rejects a non-dominant hero', () => {
  assert.throws(() => assertLayout({ hero: { x: 0, y: 0, w: 10, h: 10 }, cells: [{ x: 0, y: 0, w: 100, h: 100 }] }), /dominant/i);
});
test('enforceHeroDominance shrinks cells rather than falling back to the tiled grid', () => {
  const before = { hero: { x: 0, y: 0, w: 100, h: 100 }, cells: [{ x: 0, y: 0, w: 100, h: 100 }] };
  const after = enforceHeroDominance(before);
  assert.equal(after.cells.length, 1, 'the memory is kept, only made smaller');
  assert.ok(after.cells[0].w < 100);
  assert.ok(heroShare(after) >= 0.55);
});
test('dominance is enforced at every contentTop, so wow never silently re-tiles', () => {
  for (const ct of [40, 60, 80, 120, 200]) {
    for (const arr of ARRANGEMENTS) {
      for (let n = 2; n <= WOW_SUPPORTING_CAP[arr]; n++) {
        const L = wowLayoutFor(arr, W, H, ct, n);
        assert.equal(L.cells.length, n, `${arr}/${ct}/${n} kept every memory`);
        assert.ok(heroShare(L) >= HERO_SHARE_FLOOR);
      }
    }
  }
});
test('FALLBACK: a canvas too small for wow geometry still renders via the standard path', () => {
  const { ctx, draws } = recordingCtx();
  // 60×60 makes every wow layout degenerate → the arrangement must fall through.
  renderBanner(ctx as never, { ...makeInput('classic', 5, 'wow'), width: 60, height: 60 } as never);
  assert.ok(draws.length > 0, 'the standard renderer still drew the banner');
});
test('an unknown arrangement in wow mode falls back rather than throwing', () => {
  const { ctx } = recordingCtx();
  assert.doesNotThrow(() => renderBanner(ctx as never, makeInput('scattered', 5, 'wow') as never));
});

// ── 6) Standard mode is byte-for-byte the old behaviour ──────────────
test('DEFAULT (no renderMode) is identical to explicit standard mode', () => {
  for (const arr of ARRANGEMENTS) {
    const a = drawCounts(arr, 5);              // renderMode omitted
    const b = drawCounts(arr, 5, 'standard');  // explicit
    assert.deepEqual([...a].sort(), [...b].sort(), `${arr} must be unchanged by the new option`);
  }
});
test('standard mode still fills its historical cell counts (no regression)', () => {
  assert.equal(supportingTotal(drawCounts('classic', 5)), 40, 'classic 8×5 grid');
  assert.equal(supportingTotal(drawCounts('pyramid', 5)), 4, 'pyramid places exactly what exists');
  assert.ok(supportingTotal(drawCounts('mosaic', 5)) > 8, 'mosaic still fills its slots');
  assert.ok(supportingTotal(drawCounts('magazine', 5)) > 8, 'magazine still fills its grids');
});
test('standard mode still repeats photos to fill the grid (unchanged tiling)', () => {
  const c = drawCounts('classic', 5);
  assert.ok(supportingDraws(c).every(([, n]) => n === 10), 'four photos × 10 = 40 cells, as before');
});

// ── 7) No production regression ──────────────────────────────────────
test('index.html does not use the render engine, so the default builder cannot regress', () => {
  const root = execSync('git rev-parse --show-toplevel', { cwd: here }).toString().trim();
  const hits = execSync('grep -c "render-engine" index.html || true', { cwd: root }).toString().trim();
  assert.equal(hits, '0', 'index.html has its own renderer and never imports this engine');
});
test('the orchestrator and the adapter are untouched by the render engine', () => {
  // index.html is intentionally NOT asserted untouched here: Sprint 15.1 (product-focus
  // cleanup) removes retired themes from it. The invariant that still matters — index.html
  // never imports this engine — is covered by the "0 render-engine references" test above.
  const root = execSync('git rev-parse --show-toplevel', { cwd: here }).toString().trim();
  for (const p of ['shared/render-orchestrator/src', 'shared/render-adapter/src']) {
    assert.equal(execSync(`git status --porcelain -- ${p}`, { cwd: root }).toString().trim(), '', `${p} must be untouched`);
  }
});
test('no checkout / pricing / Stripe / Printful files were changed', () => {
  const root = execSync('git rev-parse --show-toplevel', { cwd: here }).toString().trim();
  const changed = execSync('git status --porcelain', { cwd: root }).toString();
  const offenders = changed.split('\n').filter((l) => /checkout|pricing|stripe|printful|gelato/i.test(l));
  assert.deepEqual(offenders, []);
});
