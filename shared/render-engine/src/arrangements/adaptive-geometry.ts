/**
 * Adaptive arrangement geometry — every layout is derived from how many photos the
 * customer actually uploaded.
 *
 * The historical standard arrangements filled a FIXED cell grid by tiling the supporting
 * photos (`tileToCount`): four photos were repeated across forty cells, and an upload
 * larger than the grid was silently truncated. Both read as a template rather than as
 * the customer's own story.
 *
 * The contract implemented here:
 *   • The advertised range is TOTAL photos, hero INCLUDED (see ARRANGEMENT_MAX_PHOTOS).
 *   • Every unique photo up to that maximum is placed exactly once — never duplicated,
 *     never silently dropped.
 *   • Anything beyond the maximum is clamped explicitly, at one documented place.
 *   • The hero stays visually dominant at every count (see HERO_MIN_AREA_RATIO).
 *
 * This module is intentionally SELF-CONTAINED (no imports) so it can be unit-tested
 * directly against `src`, mirroring the proven shape of `wow-geometry.ts`. Every layout
 * is a pure function of (W, H, contentTop, n) — plus an injected `rand` for Scattered,
 * so seeded rendering stays deterministic.
 */

export type AdaptiveArrangementId = 'classic' | 'magazine' | 'pyramid' | 'scattered' | 'mosaic';

export interface Rect { x: number; y: number; w: number; h: number }
export interface AdaptiveLayout {
  hero: Rect;
  /** Exactly one cell per supporting photo. Never longer, never shorter. */
  cells: Rect[];
}

// ── The published contract ───────────────────────────────────────────────────
/**
 * Maximum TOTAL photos per arrangement, hero included. These are the numbers the
 * picker advertises ("Best with 1–50 photos"), so the engine and the UI cannot drift.
 */
export const ARRANGEMENT_MAX_PHOTOS: Record<AdaptiveArrangementId, number> = {
  classic: 50,
  magazine: 25,
  pyramid: 28,
  scattered: 40,
  mosaic: 40,
};

/** Minimum TOTAL photos per arrangement, hero included. Guidance only — never enforced
 * destructively, because a customer must always see something rather than an error. */
export const ARRANGEMENT_MIN_PHOTOS: Record<AdaptiveArrangementId, number> = {
  classic: 1,
  magazine: 3,
  pyramid: 3,
  scattered: 5,
  mosaic: 8,
};

/** How many SUPPORTING photos an arrangement can hold (total maximum minus the hero). */
export function supportingCapacity(arrangement: string): number {
  const total = ARRANGEMENT_MAX_PHOTOS[arrangement as AdaptiveArrangementId] ?? 50;
  return Math.max(0, total - 1);
}

/**
 * How many supporting photos will actually be drawn: every one the customer uploaded,
 * up to the documented capacity. This is the ONLY place an upload is ever shortened,
 * and it never wraps — so a photo is placed at most once.
 */
export function supportingCount(arrangement: string, available: number): number {
  return Math.max(0, Math.min(supportingCapacity(arrangement), Math.floor(available)));
}

// ── Shared primitives ────────────────────────────────────────────────────────
const MARGIN = 40;
const GAP = 8;
const area = (r: Rect): number => Math.max(0, r.w) * Math.max(0, r.h);
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The hero must be at least this many times the area of the largest supporting cell. */
export const HERO_MIN_AREA_RATIO = 4;

/** Hero area ÷ largest cell area. Infinity when there are no supporting cells. */
export function heroRatio(layout: AdaptiveLayout): number {
  const largest = layout.cells.reduce((m, c) => Math.max(m, area(c)), 0);
  return largest > 0 ? area(layout.hero) / largest : Infinity;
}

/**
 * Shrink supporting cells about their own centres until the hero clearly commands the
 * frame. A near-miss on dominance is a sizing problem, not a reason to drop a photo —
 * so we scale, never discard.
 */
export function enforceHeroDominance(layout: AdaptiveLayout, target = HERO_MIN_AREA_RATIO * 1.1): AdaptiveLayout {
  let cells = layout.cells;
  for (let i = 0; i < 40 && heroRatio({ hero: layout.hero, cells }) < target; i++) {
    const k = 0.96;
    cells = cells.map((c) => ({
      x: c.x + (c.w * (1 - k)) / 2,
      y: c.y + (c.h * (1 - k)) / 2,
      w: c.w * k,
      h: c.h * k,
    }));
  }
  return { hero: layout.hero, cells };
}

/**
 * A layout is usable only when every rect is finite, positive, inside the canvas, and
 * the hero dominates. Throws otherwise so the caller can fall back to a safe layout.
 */
export function assertAdaptiveLayout(layout: AdaptiveLayout, W: number, H: number, expectedCells: number): AdaptiveLayout {
  const ok = (r: Rect): boolean =>
    [r.x, r.y, r.w, r.h].every(Number.isFinite) &&
    r.w > 1 && r.h > 1 &&
    r.x >= -0.5 && r.y >= -0.5 &&
    r.x + r.w <= W + 0.5 && r.y + r.h <= H + 0.5;

  if (!layout || !ok(layout.hero)) throw new Error('adaptive geometry: degenerate hero rect');
  if (layout.cells.length !== expectedCells) {
    throw new Error(`adaptive geometry: placed ${layout.cells.length} cells, expected ${expectedCells}`);
  }
  for (const c of layout.cells) if (!ok(c)) throw new Error('adaptive geometry: degenerate cell rect');
  if (heroRatio(layout) < HERO_MIN_AREA_RATIO) throw new Error('adaptive geometry: hero is not dominant');
  return layout;
}

/** Split `n` across `rows` rows, balanced to within one (e.g. 20 over 3 → 7, 7, 6). */
export function distributeRows(n: number, rows: number): number[] {
  const out: number[] = [];
  let left = n;
  for (let r = rows; r > 0; r--) {
    const take = Math.ceil(left / r);
    out.push(take);
    left -= take;
  }
  return out;
}

/**
 * Pack exactly `n` square cells into a boxW × boxH region as balanced, centred rows.
 * Picks the column count that yields the LARGEST cell that still fits, so the block
 * adapts its own shape to the count instead of assuming one.
 *
 * Returns cells at local coordinates (origin 0,0) plus the block's own height, so the
 * caller can anchor the block wherever it wants without dead space.
 */
export function packBlock(
  n: number,
  boxW: number,
  boxH: number,
  gap = GAP,
  maxSide = Infinity,
): { cells: Rect[]; h: number } {
  if (n <= 0 || boxW <= 0 || boxH <= 0) return { cells: [], h: 0 };

  let bestCols = 1;
  let bestSide = 0;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const side = Math.min((boxW - gap * (cols - 1)) / cols, (boxH - gap * (rows - 1)) / rows);
    if (side > bestSide) { bestSide = side; bestCols = cols; }
  }
  // Floor at a positive size so the block is TOTAL: even on a pathological canvas every
  // photo still gets a cell. (assertAdaptiveLayout rejects such a layout and the caller
  // falls back — but a photo is never quietly dropped by the packer itself.)
  const side = Math.max(1, Math.min(bestSide, maxSide));
  if (!Number.isFinite(side)) return { cells: [], h: 0 };

  const rows = Math.ceil(n / bestCols);
  const counts = distributeRows(n, rows);
  const cells: Rect[] = [];
  counts.forEach((count, r) => {
    const rowW = count * side + (count - 1) * gap;
    let x = (boxW - rowW) / 2;
    const y = r * (side + gap);
    for (let i = 0; i < count; i++) { cells.push({ x, y, w: side, h: side }); x += side + gap; }
  });
  return { cells, h: rows * side + gap * (rows - 1) };
}

/** Move a block of local-coordinate cells to an absolute origin. */
const at = (cells: Rect[], ox: number, oy: number): Rect[] =>
  cells.map((c) => ({ x: c.x + ox, y: c.y + oy, w: c.w, h: c.h }));

// ── Classic ──────────────────────────────────────────────────────────────────
/**
 * Classic — a commanding hero above one balanced grid of every remaining photo.
 * The grid band grows with the photo count; the hero absorbs whatever is left, so a
 * one-photo banner and a fifty-photo banner are both full compositions.
 */
export function classicAdaptiveLayout(W: number, H: number, contentTop: number, n: number): AdaptiveLayout {
  const innerW = W - MARGIN * 2;
  const top = Math.max(140, contentTop);
  const bottom = H - MARGIN;
  const avail = bottom - top;

  if (n <= 0) return { hero: { x: MARGIN, y: top, w: innerW, h: avail }, cells: [] };

  // More photos earn a deeper band, but the hero always keeps the majority of the height.
  const bandFrac = clamp(0.17 + 0.055 * Math.sqrt(n), 0.17, 0.44);
  const block = packBlock(n, innerW, avail * bandFrac, GAP);
  const blockTop = bottom - block.h;
  const hero = { x: MARGIN, y: top, w: innerW, h: blockTop - 28 - top };
  return { hero, cells: at(block.cells, MARGIN, blockTop) };
}

// ── Magazine ─────────────────────────────────────────────────────────────────
/**
 * Magazine — an editorial hero with a supporting rail beside it. When the rail can hold
 * every photo the hero runs the full column (generous negative space, no dead band);
 * once it cannot, the hero yields height and the remainder becomes a grid below it.
 * The hero also widens as the count falls, so three photos never look like a gap.
 */
export function magazineAdaptiveLayout(W: number, H: number, contentTop: number, n: number): AdaptiveLayout {
  const innerW = W - MARGIN * 2;
  const top = Math.max(128, contentTop);
  const bottom = H - MARGIN;
  const availH = bottom - top;

  const heroW = innerW * clamp(0.76 - 0.010 * n, 0.56, 0.76);
  if (n <= 0) return { hero: { x: MARGIN, y: top, w: heroW, h: availH }, cells: [] };

  const railX = MARGIN + heroW + GAP;
  const railW = innerW - heroW - GAP;
  const maxRailSide = heroW * 0.30;
  const railCols = Math.max(1, Math.min(3, Math.floor((railW + GAP) / (maxRailSide + GAP))));
  const railSide = Math.min(maxRailSide, (railW - GAP * (railCols - 1)) / railCols);
  const railRowsIn = (h: number): number => Math.max(1, Math.floor((h + GAP) / (railSide + GAP)));

  let heroH: number;
  let railCount: number;
  if (n <= railCols * railRowsIn(availH)) {
    heroH = availH;                                   // rail holds everything — no band below
    railCount = n;
  } else {
    heroH = availH * 0.60;
    railCount = Math.min(n, railCols * railRowsIn(heroH));
  }
  const belowCount = n - railCount;

  const rail = packBlock(railCount, railW, heroH, GAP, railSide);
  const cells = at(rail.cells, railX, top + (heroH - rail.h) / 2);

  if (belowCount > 0) {
    const belowTop = top + heroH + GAP;
    const below = packBlock(belowCount, innerW, bottom - belowTop, GAP, heroW * 0.26);
    cells.push(...at(below.cells, MARGIN, belowTop + (bottom - belowTop - below.h) / 2));
  }
  return { hero: { x: MARGIN, y: top, w: heroW, h: heroH }, cells };
}

// ── Mosaic ───────────────────────────────────────────────────────────────────
/**
 * Mosaic — the hero at the centre of a woven frame: a band above, a rail down each
 * side, a band below. Photos are split between the three regions in proportion to the
 * area each actually has, so the mosaic thickens with the count instead of leaving
 * empty slots or overflowing one region.
 */
export function mosaicAdaptiveLayout(W: number, H: number, contentTop: number, n: number): AdaptiveLayout {
  const innerW = W - MARGIN * 2;
  const bottom = H - MARGIN;
  const heroW = Math.min(340, innerW * 0.44);
  const heroY = contentTop + Math.floor((bottom - contentTop) * 0.20);
  // Keep a real band below the hero even when the headline pushes contentTop down.
  const heroH = Math.min(heroW * (380 / 320), (bottom - heroY) * 0.55);
  const hero = { x: (W - heroW) / 2, y: heroY, w: heroW, h: heroH };
  if (n <= 0) return { hero, cells: [] };

  const railW = (innerW - heroW - GAP * 2) / 2;
  const topBand = heroY - GAP - contentTop;
  const botTop = heroY + heroH + GAP;
  const botBand = bottom - botTop;

  // Weight each region by the area it actually offers.
  const weights = [
    innerW * Math.max(0, topBand),
    2 * Math.max(0, railW) * heroH,
    innerW * Math.max(0, botBand),
  ];
  const [topN, sideN, botN] = splitByWeight(n, weights);

  const maxSide = heroW * 0.34;
  const cells: Rect[] = [];

  const topBlock = packBlock(topN, innerW, topBand, GAP, maxSide);
  cells.push(...at(topBlock.cells, MARGIN, contentTop + (topBand - topBlock.h) / 2));

  const leftN = Math.ceil(sideN / 2);
  const leftBlock = packBlock(leftN, railW, heroH, GAP, maxSide);
  cells.push(...at(leftBlock.cells, MARGIN, heroY + (heroH - leftBlock.h) / 2));

  const rightBlock = packBlock(sideN - leftN, railW, heroH, GAP, maxSide);
  cells.push(...at(rightBlock.cells, W - MARGIN - railW, heroY + (heroH - rightBlock.h) / 2));

  const botBlock = packBlock(botN, innerW, botBand, GAP, maxSide);
  cells.push(...at(botBlock.cells, MARGIN, botTop + (botBand - botBlock.h) / 2));

  return { hero, cells };
}

/** Split `n` across regions in proportion to `weights`, using largest-remainder so the
 * parts always sum to exactly `n` — no photo is lost or invented by rounding. */
export function splitByWeight(n: number, weights: number[]): number[] {
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0);
  if (total <= 0) return weights.map((_, i) => (i === 0 ? n : 0));
  const exact = weights.map((w) => (n * Math.max(0, w)) / total);
  const out = exact.map((e) => Math.floor(e));
  let left = n - out.reduce((s, v) => s + v, 0);
  const order = exact
    .map((e, i) => ({ i, frac: e - Math.floor(e) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length].i]++;
  return out;
}

// ── Scattered ────────────────────────────────────────────────────────────────
/**
 * Scattered — a scrapbook gathered around a central hero. Rather than fixed pin-board
 * positions, we lay a grid over the content area, reserve a centred block for the hero,
 * and settle the photos into the free cells nearest the hero, ring by ring. The grid is
 * chosen as the coarsest one that can hold the count, so few photos are large and many
 * photos are small — and no photo is ever repeated to fill the board.
 *
 * `rand` is the caller's seeded PRNG, so the jitter is deterministic for a given seed.
 */
export function scatteredAdaptiveLayout(
  W: number, H: number, contentTop: number, n: number, rand: () => number,
): AdaptiveLayout {
  const gap = 10;
  const jitter = 6;                                   // area is inset by this, so jitter stays in bounds
  const left = MARGIN + jitter;
  const top = contentTop + 16 + jitter;
  const bottom = H - MARGIN - jitter;
  const areaW = W - (MARGIN + jitter) * 2;
  const areaH = bottom - top;

  if (n <= 0) {
    const heroW = Math.min(360, areaW * 0.55);
    const heroH = Math.min(heroW * 1.12, areaH);
    return { hero: { x: (W - heroW) / 2, y: top + (areaH - heroH) / 2, w: heroW, h: heroH }, cells: [] };
  }

  // Coarsest grid that leaves room for every photo around the hero block.
  let cols = 4, rows = 4, cellW = 0, cellH = 0, heroCols = 2, heroRows = 2;
  for (cols = 4; cols <= 12; cols++) {
    cellW = (areaW - gap * (cols - 1)) / cols;
    rows = Math.max(4, Math.round(areaH / Math.max(1, cellW)));
    cellH = (areaH - gap * (rows - 1)) / rows;
    heroCols = clamp(Math.round(cols * 0.5), 2, cols - 2);
    heroRows = clamp(Math.round(rows * 0.5), 2, rows - 2);
    if (cols * rows - heroCols * heroRows >= n) break;
  }

  const hc0 = Math.floor((cols - heroCols) / 2);
  const hr0 = Math.floor((rows - heroRows) / 2);
  const cellX = (c: number): number => left + c * (cellW + gap);
  const cellY = (r: number): number => top + r * (cellH + gap);
  const hero = {
    x: cellX(hc0),
    y: cellY(hr0),
    w: heroCols * cellW + (heroCols - 1) * gap,
    h: heroRows * cellH + (heroRows - 1) * gap,
  };
  const heroCx = hero.x + hero.w / 2;
  const heroCy = hero.y + hero.h / 2;

  // Free cells, ordered outward from the hero (ring), then around it (angle), so the
  // scrapbook gathers rather than scattering to the corners first.
  const free: { r: number; c: number; ring: number; angle: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const insideCols = c >= hc0 && c < hc0 + heroCols;
      const insideRows = r >= hr0 && r < hr0 + heroRows;
      if (insideCols && insideRows) continue;
      const dc = c < hc0 ? hc0 - c : (c >= hc0 + heroCols ? c - (hc0 + heroCols) + 1 : 0);
      const dr = r < hr0 ? hr0 - r : (r >= hr0 + heroRows ? r - (hr0 + heroRows) + 1 : 0);
      const cx = cellX(c) + cellW / 2;
      const cy = cellY(r) + cellH / 2;
      free.push({ r, c, ring: Math.max(dc, dr), angle: Math.atan2(cy - heroCy, cx - heroCx) });
    }
  }
  free.sort((a, b) => a.ring - b.ring || a.angle - b.angle || a.r - b.r || a.c - b.c);

  const cells: Rect[] = free.slice(0, n).map((f) => ({
    x: cellX(f.c) + (rand() * 2 - 1) * jitter,
    y: cellY(f.r) + (rand() * 2 - 1) * jitter,
    w: cellW,
    h: cellH,
  }));
  return { hero, cells };
}

// ── Fallback ─────────────────────────────────────────────────────────────────
/**
 * A layout that cannot fail: hero on top, every remaining photo in one grid beneath.
 * Used when an arrangement's own geometry is degenerate for an extreme canvas — it
 * still places each photo exactly once, so a fallback never reintroduces repetition.
 */
export function fallbackLayout(W: number, H: number, contentTop: number, n: number): AdaptiveLayout {
  const innerW = Math.max(20, W - MARGIN * 2);
  const top = clamp(contentTop, 0, H - 40);
  const bottom = Math.max(top + 20, H - MARGIN);
  const avail = bottom - top;
  if (n <= 0) return { hero: { x: MARGIN, y: top, w: innerW, h: avail }, cells: [] };

  const block = packBlock(n, innerW, avail * 0.42, 4);
  const blockTop = bottom - block.h;
  return {
    hero: { x: MARGIN, y: top, w: innerW, h: Math.max(20, blockTop - 12 - top) },
    cells: at(block.cells, MARGIN, blockTop),
  };
}

// ── Dispatch ─────────────────────────────────────────────────────────────────
/**
 * Build the adaptive layout for an arrangement. Never throws: a degenerate canvas falls
 * back to the safe grid rather than to the old tiling, so `cells.length === n` always.
 */
export function adaptiveLayoutFor(
  arrangement: string, W: number, H: number, contentTop: number, n: number, rand: () => number,
): AdaptiveLayout {
  try {
    const build = (): AdaptiveLayout => {
      switch (arrangement) {
        case 'classic': return classicAdaptiveLayout(W, H, contentTop, n);
        case 'magazine': return magazineAdaptiveLayout(W, H, contentTop, n);
        case 'mosaic': return mosaicAdaptiveLayout(W, H, contentTop, n);
        case 'scattered': return scatteredAdaptiveLayout(W, H, contentTop, n, rand);
        default: return fallbackLayout(W, H, contentTop, n);
      }
    };
    return assertAdaptiveLayout(enforceHeroDominance(build()), W, H, n);
  } catch {
    return fallbackLayout(W, H, contentTop, n);
  }
}
