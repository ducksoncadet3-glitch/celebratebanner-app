/**
 * Adaptive arrangements — the launch contract.
 *
 * The defect these tests lock out: the built-in arrangements filled a FIXED cell grid
 * by tiling the supporting photos, so a handful of photos were repeated across dozens
 * of cells and a large upload was silently truncated. Pyramid was the only arrangement
 * that adapted.
 *
 * Two layers of proof, mirroring wowGeometry.test.ts:
 *   1. The pure geometry module (imported from src — it is dependency-free).
 *   2. The REAL renderer, driven through a recording RenderContext that tracks the
 *      canvas transform and each photo's CLIP rect, so we can prove exactly which photo
 *      was drawn, how many times, and where on the canvas it actually landed.
 *
 * Run:  npm test        (builds dist first, then node --test 'test/*.test.ts')
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARRANGEMENT_MAX_PHOTOS, ARRANGEMENT_MIN_PHOTOS, HERO_MIN_AREA_RATIO,
  adaptiveLayoutFor, supportingCapacity, supportingCount, heroRatio,
  distributeRows, packBlock, splitByWeight, fallbackLayout,
  classicAdaptiveLayout, magazineAdaptiveLayout, mosaicAdaptiveLayout, scatteredAdaptiveLayout,
} from '../src/arrangements/adaptive-geometry.ts';
// The built engine (dist) — its `.js` specifiers resolve to real files.
import { renderBanner, listArrangements, mulberry32 } from '../dist/index.js';

const W = 800, H = 1200, CT = 200;

/** The test matrix required for launch: TOTAL photo counts, hero included. */
const MATRIX: Record<string, number[]> = {
  classic: [1, 2, 10, 25, 50],
  magazine: [3, 5, 12, 25],
  pyramid: [3, 10, 20, 28],
  scattered: [5, 10, 20, 40],
  mosaic: [8, 12, 21, 40],
};
const IDS = Object.keys(MATRIX);

// ── a recording 2D context ───────────────────────────────────────────────────
// Tracks the affine transform and the most recent clip() path, so every photo draw is
// attributed to the rect actually painted on the canvas. (The bitmap itself is drawn
// LARGER than its frame on purpose — object-fit: cover — and is then clipped, so the
// clip rect is the only honest measure of where a photo lands.)
interface Mat { a: number; b: number; c: number; d: number; e: number; f: number }
interface PhotoDraw { id: string; x: number; y: number; w: number; h: number }

function recordingCtx() {
  const draws: PhotoDraw[] = [];
  let m: Mat = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const stack: Mat[] = [];
  let pts: [number, number][] = [];
  let clipBox: { x: number; y: number; w: number; h: number } | null = null;
  const grad = { addColorStop() {} };

  const mul = (p: Mat, q: Mat): Mat => ({
    a: p.a * q.a + p.c * q.b, b: p.b * q.a + p.d * q.b,
    c: p.a * q.c + p.c * q.d, d: p.b * q.c + p.d * q.d,
    e: p.a * q.e + p.c * q.f + p.e, f: p.b * q.e + p.d * q.f + p.f,
  });
  const push = (x: number, y: number): void => {
    pts.push([m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  };

  const handlers: Record<string, (...a: never[]) => unknown> = {
    save: () => { stack.push({ ...m }); return undefined; },
    restore: () => { const p = stack.pop(); if (p) m = p; return undefined; },
    translate: ((x: number, y: number) => { m = mul(m, { a: 1, b: 0, c: 0, d: 1, e: x, f: y }); }) as never,
    rotate: ((r: number) => {
      const c = Math.cos(r), s = Math.sin(r);
      m = mul(m, { a: c, b: s, c: -s, d: c, e: 0, f: 0 });
    }) as never,
    scale: ((x: number, y: number) => { m = mul(m, { a: x, b: 0, c: 0, d: y, e: 0, f: 0 }); }) as never,
    beginPath: () => { pts = []; return undefined; },
    moveTo: ((x: number, y: number) => push(x, y)) as never,
    lineTo: ((x: number, y: number) => push(x, y)) as never,
    arcTo: ((x1: number, y1: number, x2: number, y2: number) => { push(x1, y1); push(x2, y2); }) as never,
    rect: ((x: number, y: number, w: number, h: number) => { push(x, y); push(x + w, y + h); }) as never,
    clip: () => {
      if (pts.length) {
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        const x = Math.min(...xs), y = Math.min(...ys);
        clipBox = { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
      }
      return undefined;
    },
    drawImage: ((image: { id?: string } | null) => {
      if (image && typeof image.id === 'string' && clipBox) {
        draws.push({ id: image.id, ...clipBox });
      }
    }) as never,
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    measureText: () => ({ width: 10 }),
  };

  const ctx = new Proxy({} as Record<string, unknown>, {
    get(_t, prop: string) { return handlers[prop] ?? (() => undefined); },
    set() { return true; },
  });
  return { ctx, draws };
}

const photo = (id: string) => ({ id, image: { id, width: 1000, height: 1000 } });
const makeInput = (arrangement: string, count: number, seed = 7) => ({
  width: W, height: H, arrangement,
  theme: { id: 'graduation', fields: ['name'], palette: { bg: '#0C0E14', accent: '#C9A84C', text: '#FAF8F3' } },
  bannerText: { name: 'Jordan' },
  photos: Array.from({ length: count }, (_, i) => photo('p' + i)),
  heroId: 'p0', frames: {}, defaultFrame: 'rounded', seed, cinematicHero: true,
});

/** Render `count` TOTAL photos and report what actually hit the canvas. */
function render(arrangement: string, count: number, seed = 7) {
  const { ctx, draws } = recordingCtx();
  renderBanner(ctx as never, makeInput(arrangement, count, seed) as never);
  const counts = new Map<string, number>();
  for (const d of draws) counts.set(d.id, (counts.get(d.id) ?? 0) + 1);
  const supporting = draws.filter((d) => d.id !== 'p0');
  const heroDraws = draws.filter((d) => d.id === 'p0');
  return { draws, counts, supporting, heroDraws };
}

const areaOf = (r: PhotoDraw): number => r.w * r.h;

// ── 1) Never duplicate a customer's photo ────────────────────────────────────
test('no arrangement ever draws the same source photo twice', () => {
  for (const arr of IDS) {
    for (const n of MATRIX[arr]) {
      const { counts } = render(arr, n);
      for (const [id, times] of counts) {
        assert.equal(times, 1, `${arr} @ ${n} photos drew ${id} ${times}× — photos must never repeat`);
      }
    }
  }
});

test('the number of distinct rendered photos never exceeds the upload', () => {
  for (const arr of IDS) {
    for (const n of MATRIX[arr]) {
      const { counts } = render(arr, n);
      assert.ok(counts.size <= n, `${arr} @ ${n}: rendered ${counts.size} distinct photos from ${n} uploaded`);
    }
  }
});

// ── 2) Never silently drop an in-range photo ─────────────────────────────────
test('every uploaded photo within the supported range is rendered', () => {
  for (const arr of IDS) {
    for (const n of MATRIX[arr]) {
      assert.ok(n <= ARRANGEMENT_MAX_PHOTOS[arr as never], `${arr} matrix point ${n} is in range`);
      const { counts } = render(arr, n);
      for (let i = 0; i < n; i++) {
        assert.ok(counts.has('p' + i), `${arr} @ ${n}: photo p${i} was silently omitted`);
      }
      assert.equal(counts.size, n, `${arr} @ ${n}: expected all ${n} photos on the banner`);
    }
  }
});

test('the hero is drawn exactly once, and is the dominant frame', () => {
  for (const arr of IDS) {
    for (const n of MATRIX[arr]) {
      const { heroDraws, supporting } = render(arr, n);
      assert.equal(heroDraws.length, 1, `${arr} @ ${n}: hero must be drawn exactly once`);
      const largest = supporting.reduce((m, s) => Math.max(m, areaOf(s)), 0);
      if (largest > 0) {
        const ratio = areaOf(heroDraws[0]) / largest;
        assert.ok(ratio >= HERO_MIN_AREA_RATIO,
          `${arr} @ ${n}: hero is only ${ratio.toFixed(2)}× the largest supporting photo`);
      }
    }
  }
});

// ── 3) Overflow is explicit, never silent ────────────────────────────────────
test('an upload beyond the documented maximum is clamped, not tiled or truncated mid-layout', () => {
  for (const arr of IDS) {
    const max = ARRANGEMENT_MAX_PHOTOS[arr as never];
    const { counts } = render(arr, 50);
    assert.ok(counts.size <= max, `${arr}: 50 photos produced ${counts.size} frames, over the ${max} maximum`);
    assert.equal(counts.size, Math.min(50, max), `${arr}: should use exactly min(50, ${max}) photos`);
    for (const [, times] of counts) assert.equal(times, 1, `${arr}: clamping must not repeat photos`);
    // Clamping keeps a contiguous prefix — the hero plus the earliest uploads.
    for (let i = 0; i < Math.min(50, max); i++) {
      assert.ok(counts.has('p' + i), `${arr}: clamped set should keep p${i}`);
    }
  }
});

test('supportingCount/supportingCapacity treat the advertised range as TOTAL photos', () => {
  for (const arr of IDS) {
    const max = ARRANGEMENT_MAX_PHOTOS[arr as never];
    assert.equal(supportingCapacity(arr), max - 1, `${arr}: hero is one of the ${max}`);
    assert.equal(supportingCount(arr, 999), max - 1, `${arr} clamps an abundant upload`);
    assert.equal(supportingCount(arr, 3), 3, `${arr} never invents supporting photos`);
    assert.equal(supportingCount(arr, 0), 0);
  }
});

test('the picker labels match the engine — advertised range is the enforced range', () => {
  for (const a of listArrangements()) {
    assert.equal(a.maxPhotos, ARRANGEMENT_MAX_PHOTOS[a.id as never], `${a.id} max`);
    assert.equal(a.minPhotos, ARRANGEMENT_MIN_PHOTOS[a.id as never], `${a.id} min`);
  }
});

// ── 4) Geometry is sane: on-canvas, positive, finite ─────────────────────────
test('every drawn photo stays inside the canvas with finite, positive geometry', () => {
  for (const arr of IDS) {
    for (const n of MATRIX[arr]) {
      const { draws } = render(arr, n);
      for (const d of draws) {
        for (const v of [d.x, d.y, d.w, d.h]) {
          assert.ok(Number.isFinite(v), `${arr} @ ${n}: ${d.id} has non-finite geometry`);
        }
        assert.ok(d.w > 1 && d.h > 1, `${arr} @ ${n}: ${d.id} is degenerate (${d.w}×${d.h})`);
        assert.ok(d.x >= -1 && d.y >= -1, `${arr} @ ${n}: ${d.id} starts off-canvas at ${d.x},${d.y}`);
        assert.ok(d.x + d.w <= W + 1, `${arr} @ ${n}: ${d.id} overflows the right edge`);
        assert.ok(d.y + d.h <= H + 1, `${arr} @ ${n}: ${d.id} overflows the bottom edge`);
      }
    }
  }
});

// ── 5) Determinism ───────────────────────────────────────────────────────────
test('a deterministic seed produces a deterministic layout', () => {
  for (const arr of IDS) {
    for (const n of MATRIX[arr]) {
      const a = render(arr, n, 4242).draws;
      const b = render(arr, n, 4242).draws;
      assert.deepEqual(a, b, `${arr} @ ${n} must be reproducible for a fixed seed`);
    }
  }
});

test('Scattered jitter is seed-driven — a different seed moves the board', () => {
  const a = render('scattered', 20, 1).draws;
  const b = render('scattered', 20, 2).draws;
  assert.notDeepEqual(a, b, 'seeded jitter should differ between seeds');
  assert.equal(a.length, b.length, 'but the photo count must not depend on the seed');
});

// ── 6) The layouts actually adapt (the defect, stated as a test) ─────────────
test('supporting frame count tracks the upload — no fixed 40 / 24 / 16 / 26 grids', () => {
  const FIXED_SLOTS: Record<string, number> = { classic: 40, magazine: 24, scattered: 16, mosaic: 26 };
  for (const arr of IDS) {
    for (const n of MATRIX[arr]) {
      const { supporting } = render(arr, n);
      assert.equal(supporting.length, n - 1,
        `${arr} @ ${n}: expected ${n - 1} supporting frames, got ${supporting.length}`);
      if (FIXED_SLOTS[arr] && n - 1 !== FIXED_SLOTS[arr]) {
        assert.notEqual(supporting.length, FIXED_SLOTS[arr],
          `${arr} regressed to its old fixed ${FIXED_SLOTS[arr]}-slot grid`);
      }
    }
  }
});

test('a hero-only upload renders the hero and nothing else, in every arrangement', () => {
  for (const arr of IDS) {
    const { counts, supporting, heroDraws } = render(arr, 1);
    assert.equal(heroDraws.length, 1, `${arr}: hero must still be drawn`);
    assert.equal(supporting.length, 0, `${arr}: nothing to support a lone hero`);
    assert.equal(counts.size, 1);
  }
});

// Magazine indexed a FIXED slot loop into an empty tiled list and threw
// "Cannot read properties of undefined (reading 'id')", which the preview swallowed —
// the customer just saw a blank canvas.
test('REGRESSION: Magazine with a single photo does not throw (blank-preview defect)', () => {
  for (let n = 1; n <= 3; n++) {
    assert.doesNotThrow(() => {
      const { ctx } = recordingCtx();
      renderBanner(ctx as never, makeInput('magazine', n) as never);
    }, `magazine @ ${n} photo(s)`);
  }
});

test('every arrangement renders below its advertised minimum without throwing', () => {
  for (const arr of IDS) {
    for (let n = 1; n <= ARRANGEMENT_MIN_PHOTOS[arr as never]; n++) {
      assert.doesNotThrow(() => {
        const { ctx } = recordingCtx();
        renderBanner(ctx as never, makeInput(arr, n) as never);
      }, `${arr} @ ${n}`);
    }
  }
});

// ── 7) The pure geometry module ──────────────────────────────────────────────
test('adaptiveLayoutFor places exactly n cells, on-canvas, hero dominant', () => {
  for (const arr of ['classic', 'magazine', 'mosaic', 'scattered']) {
    for (let n = 0; n <= supportingCapacity(arr); n++) {
      const L = adaptiveLayoutFor(arr, W, H, CT, n, mulberry32(7));
      assert.equal(L.cells.length, n, `${arr}/${n} kept every photo`);
      for (const r of [L.hero, ...L.cells]) {
        assert.ok([r.x, r.y, r.w, r.h].every(Number.isFinite), `${arr}/${n} finite`);
        assert.ok(r.w > 1 && r.h > 1, `${arr}/${n} positive`);
        assert.ok(r.x >= -0.5 && r.y >= -0.5 && r.x + r.w <= W + 0.5 && r.y + r.h <= H + 0.5,
          `${arr}/${n} in bounds`);
      }
      assert.ok(heroRatio(L) >= HERO_MIN_AREA_RATIO, `${arr}/${n} hero dominant`);
    }
  }
});

test('the geometry survives a cramped contentTop at every count', () => {
  for (const arr of ['classic', 'magazine', 'mosaic', 'scattered']) {
    for (const ct of [40, 120, 300, 600, 900]) {
      for (const n of [0, 1, 5, 17, supportingCapacity(arr)]) {
        const L = adaptiveLayoutFor(arr, W, H, ct, n, mulberry32(3));
        assert.equal(L.cells.length, n, `${arr}/${ct}/${n}`);
        for (const r of [L.hero, ...L.cells]) {
          assert.ok(r.w > 1 && r.h > 1 && Number.isFinite(r.x) && Number.isFinite(r.y),
            `${arr}/${ct}/${n} degenerate rect`);
        }
      }
    }
  }
});

test('adaptiveLayoutFor never throws, even on an absurd canvas', () => {
  for (const arr of ['classic', 'magazine', 'mosaic', 'scattered', 'nonsense']) {
    for (const [w, h] of [[60, 60], [10, 4000], [4000, 10], [1, 1]]) {
      assert.doesNotThrow(() => adaptiveLayoutFor(arr, w, h, 20, 9, mulberry32(1)), `${arr} ${w}×${h}`);
    }
  }
});

test('distributeRows balances to within one and never loses a photo', () => {
  for (let n = 1; n <= 60; n++) {
    for (let rows = 1; rows <= Math.min(n, 8); rows++) {
      const d = distributeRows(n, rows);
      assert.equal(d.length, rows);
      assert.equal(d.reduce((s, v) => s + v, 0), n, `sum for ${n}/${rows}`);
      assert.ok(Math.max(...d) - Math.min(...d) <= 1, `balance for ${n}/${rows}`);
    }
  }
});

test('splitByWeight always sums to n, so a region split cannot lose a photo', () => {
  for (let n = 0; n <= 45; n++) {
    for (const w of [[1, 1, 1], [5, 0, 2], [0, 0, 0], [132, 145, 276]]) {
      const parts = splitByWeight(n, w);
      assert.equal(parts.reduce((s, v) => s + v, 0), n, `n=${n} w=${w}`);
      assert.ok(parts.every((p) => p >= 0));
    }
  }
});

test('packBlock places exactly n square cells inside its box', () => {
  for (let n = 1; n <= 49; n++) {
    const { cells, h } = packBlock(n, 720, 400, 8);
    assert.equal(cells.length, n, `packBlock(${n})`);
    assert.ok(h <= 400 + 0.001, `packBlock(${n}) height ${h} exceeded the box`);
    for (const c of cells) {
      assert.ok(c.w > 0 && c.h > 0 && Math.abs(c.w - c.h) < 1e-9, 'cells are square and positive');
      assert.ok(c.x >= -0.001 && c.x + c.w <= 720.001, 'cells stay inside the box width');
    }
  }
  assert.deepEqual(packBlock(0, 100, 100).cells, [], 'zero photos → zero cells');
});

test('fallbackLayout is total: it never throws and never loses a photo', () => {
  for (const [w, h, ct] of [[800, 1200, 200], [60, 60, 10], [1, 1, 0], [4000, 10, 5]]) {
    for (const n of [0, 1, 12, 49]) {
      const L = fallbackLayout(w, h, ct, n);
      assert.equal(L.cells.length, n, `fallback ${w}×${h} n=${n}`);
    }
  }
});

test('each arrangement geometry keeps its own character', () => {
  // Classic: one grid strictly below a full-width hero.
  const c = classicAdaptiveLayout(W, H, CT, 12);
  assert.ok(c.cells.every((x) => x.y >= c.hero.y + c.hero.h), 'classic grid sits below the hero');
  assert.ok(c.hero.w > W * 0.8, 'classic hero spans the banner');

  // Magazine: a rail beside the hero, never overlapping it.
  const m = magazineAdaptiveLayout(W, H, CT, 4);
  assert.ok(m.cells.every((x) => x.x >= m.hero.x + m.hero.w), 'magazine rail sits beside the hero');

  // Mosaic: photos both above and below a centred hero.
  const mo = mosaicAdaptiveLayout(W, H, CT, 20);
  assert.ok(mo.cells.some((x) => x.y + x.h <= mo.hero.y), 'mosaic weaves above the hero');
  assert.ok(mo.cells.some((x) => x.y >= mo.hero.y + mo.hero.h), 'mosaic weaves below the hero');
  assert.ok(Math.abs((mo.hero.x + mo.hero.w / 2) - W / 2) < 1, 'mosaic hero is centred');

  // Scattered: photos gather all around the hero, never on top of it.
  const s = scatteredAdaptiveLayout(W, H, CT, 16, mulberry32(9));
  const overlaps = s.cells.filter((x) =>
    x.x < s.hero.x + s.hero.w && x.x + x.w > s.hero.x &&
    x.y < s.hero.y + s.hero.h && x.y + x.h > s.hero.y);
  assert.equal(overlaps.length, 0, 'scattered photos never cover the hero');
});

// ── 8) Scope guard ───────────────────────────────────────────────────────────
test('no photo is ever fabricated: rendered ids are always a subset of the upload', () => {
  for (const arr of IDS) {
    for (const n of [1, 5, 21, 50]) {
      const { counts } = render(arr, n);
      const uploaded = new Set(Array.from({ length: n }, (_, i) => 'p' + i));
      for (const id of counts.keys()) {
        assert.ok(uploaded.has(id), `${arr} @ ${n}: rendered ${id}, which was never uploaded`);
      }
    }
  }
});
