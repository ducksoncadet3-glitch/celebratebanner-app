/**
 * WOW arrangement geometry — intentional supporting layouts.
 *
 * The standard arrangements fill a FIXED cell grid by tiling the supporting photos
 * (`tileToCount`), so four photos get repeated across forty cells. That reads as a
 * template. In WOW mode we instead derive the geometry from how many photos actually
 * exist: fewer, larger, deliberately placed cells — and never a repeat.
 *
 * This module is intentionally SELF-CONTAINED (no imports) so it can be unit-tested
 * directly, and so the standard render path is untouched when `renderMode` is absent.
 * Every layout is a pure function of (W, H, contentTop, n).
 */

export type WowArrangementId = 'classic' | 'magazine' | 'mosaic' | 'pyramid' | 'scattered';

export interface Rect { x: number; y: number; w: number; h: number }
export interface WowLayout {
  hero: Rect;
  /** One cell per supporting photo. Never longer than the photo count — no tiling. */
  cells: Rect[];
}

/** Arrangement-specific maximum number of supporting photos in WOW mode. */
export const WOW_SUPPORTING_CAP: Record<WowArrangementId, number> = {
  classic: 6,    // Signature Edition — clean museum strip (3–6)
  pyramid: 4,    // Luxury Gold      — sparse and dramatic (2–4)
  mosaic: 8,     // Family Legacy    — layered story rhythm (5–8)
  magazine: 5,   // Modern Editorial — magazine row (3–5)
  scattered: 6,
};

/** How many supporting photos this arrangement will draw. Never more than available. */
export function wowSupportingCount(arrangement: string, available: number): number {
  const cap = WOW_SUPPORTING_CAP[arrangement as WowArrangementId] ?? 6;
  return Math.max(0, Math.min(cap, Math.floor(available)));
}

const MARGIN = 40;
const GAP = 12;
const area = (r: Rect): number => Math.max(0, r.w) * Math.max(0, r.h);

/** Hero's share of the drawn photo area. The hero must stay the clear focal point. */
export function heroShare(layout: WowLayout): number {
  const hero = area(layout.hero);
  const cells = layout.cells.reduce((s, c) => s + area(c), 0);
  const total = hero + cells;
  return total > 0 ? hero / total : 1;
}

/** The hero must command at least this share of the drawn photo area. */
export const HERO_SHARE_FLOOR = 0.55;

/**
 * Shrink the supporting cells (about their own centres) until the hero commands the
 * frame. A near-miss on dominance is a sizing problem, not a reason to fall back to
 * the tiled grid — falling back would reintroduce the very repetition we removed.
 */
export function enforceHeroDominance(layout: WowLayout, target = 0.58): WowLayout {
  let cells = layout.cells;
  for (let i = 0; i < 24 && heroShare({ hero: layout.hero, cells }) < target; i++) {
    const k = 0.94;
    cells = cells.map((c) => ({ x: c.x + (c.w * (1 - k)) / 2, y: c.y + (c.h * (1 - k)) / 2, w: c.w * k, h: c.h * k }));
  }
  return { hero: layout.hero, cells };
}

/** A layout is usable only when every rect is finite and positive. Throws otherwise. */
export function assertLayout(layout: WowLayout): WowLayout {
  const ok = (r: Rect): boolean =>
    [r.x, r.y, r.w, r.h].every(Number.isFinite) && r.w > 1 && r.h > 1;
  if (!layout || !ok(layout.hero)) throw new Error('wow geometry: degenerate hero rect');
  for (const c of layout.cells) if (!ok(c)) throw new Error('wow geometry: degenerate cell rect');
  if (heroShare(layout) < HERO_SHARE_FLOOR) throw new Error('wow geometry: hero is not dominant');
  return layout;
}

/** Evenly spaced squares of side `s`, centred horizontally, on one row at `y`. */
function centredRow(W: number, y: number, count: number, s: number, gap = GAP): Rect[] {
  if (count <= 0) return [];
  const totalW = count * s + (count - 1) * gap;
  let x = (W - totalW) / 2;
  const out: Rect[] = [];
  for (let i = 0; i < count; i++) { out.push({ x, y, w: s, h: s }); x += s + gap; }
  return out;
}

/**
 * Signature Edition — a large centred hero above one clean museum strip.
 * The hero grows to fill everything the strip does not need: no dead space.
 */
export function classicWowLayout(W: number, H: number, contentTop: number, n: number): WowLayout {
  const innerW = W - MARGIN * 2;
  const heroY = Math.max(140, contentTop);
  const stripBot = H - MARGIN;

  if (n <= 0) {
    return { hero: { x: MARGIN, y: heroY, w: innerW, h: stripBot - heroY }, cells: [] };
  }
  const perCell = (innerW - GAP * (n - 1)) / n;
  const side = Math.min(perCell, Math.round(H * 0.16));
  const stripTop = stripBot - side;
  const cells = centredRow(W, stripTop, n, side);
  const hero = { x: MARGIN, y: heroY, w: innerW, h: stripTop - 28 - heroY };
  return { hero, cells };
}

/**
 * Luxury Gold — a square hero with a sparse, dramatic pyramid beneath it.
 * Rows widen (2, 3, …) but never repeat a photo, and never exceed four frames.
 */
export function pyramidWowLayout(W: number, H: number, contentTop: number, n: number): WowLayout {
  const innerW = W - MARGIN * 2;
  const innerH = H - contentTop - 60;
  const heroSize = Math.min(innerW * 0.45, innerH * 0.40);
  const hero = { x: (W - heroSize) / 2, y: contentTop + 8, w: heroSize, h: heroSize };
  if (n <= 0) return { hero, cells: [] };

  const rows: number[] = [];
  let remaining = n, cols = 2;
  while (remaining > 0) { const take = Math.min(cols, remaining); rows.push(take); remaining -= take; cols++; }

  const pyTop = hero.y + heroSize + 40;
  const pyBottom = H - 50;
  const rowH = Math.max(40, (pyBottom - pyTop) / rows.length);
  const widest = Math.max(...rows);
  const maxByWidth = (innerW - GAP * (widest - 1)) / widest;
  const side = Math.max(28, Math.min(rowH * 0.62, maxByWidth, heroSize * 0.42));

  const cells: Rect[] = [];
  rows.forEach((count, r) => cells.push(...centredRow(W, pyTop + r * rowH + (rowH - side) / 2, count, side)));
  return { hero, cells };
}

/**
 * Family Legacy — a layered story: memories gathered above and below the hero.
 * Cells are deliberately smaller than the hero so the story never outshouts it.
 */
export function mosaicWowLayout(W: number, H: number, contentTop: number, n: number): WowLayout {
  const innerW = W - MARGIN * 2;
  const contentBottom = H - MARGIN;
  const heroW = Math.min(320, innerW * 0.60);
  const heroH = heroW * (380 / 320);                       // preserve the 320×380 aspect
  const hero = { x: (W - heroW) / 2, y: contentTop + Math.floor((contentBottom - contentTop) * 0.22), w: heroW, h: heroH };
  if (n <= 0) return { hero, cells: [] };

  const topCount = Math.ceil(n / 2);
  const botCount = n - topCount;
  const topBand = Math.max(24, hero.y - contentTop - GAP);
  const botTopY = hero.y + heroH + GAP;
  const botBand = Math.max(24, contentBottom - botTopY);

  // A supporting memory must never rival the hero — cap its side against the hero width.
  const sideFor = (count: number, band: number): number =>
    count > 0 ? Math.min(band * 0.78, (innerW - GAP * (count - 1)) / count, heroW * 0.32) * 0.94 : 0;

  const topSide = sideFor(topCount, topBand);
  const botSide = sideFor(botCount, botBand);
  const cells = [
    ...centredRow(W, contentTop + (topBand - topSide) / 2, topCount, topSide),
    ...centredRow(W, botTopY + (botBand - botSide) / 2, botCount, botSide),
  ];
  return { hero, cells };
}

/**
 * Modern Editorial — an off-centre hero with expansive negative space to its right,
 * answered by one restrained magazine row beneath.
 */
export function magazineWowLayout(W: number, H: number, contentTop: number, n: number): WowLayout {
  const innerW = W - MARGIN * 2;
  const heroY = Math.max(128, contentTop);
  const heroW = innerW * 0.62;
  const heroH = heroW * (420 / 460);                       // preserve the 460×420 aspect
  const hero = { x: MARGIN, y: heroY, w: heroW, h: heroH };
  if (n <= 0) return { hero, cells: [] };

  const rowTop = heroY + heroH + 28;
  const band = Math.max(24, (H - MARGIN) - rowTop);
  const perCell = (innerW - GAP * (n - 1)) / n;
  const side = Math.min(perCell, band * 0.72, heroW * 0.34);
  const cells = centredRow(W, rowTop + (band - side) / 2, n, side);
  return { hero, cells };
}

/** Pick the layout for an arrangement. Throws on degenerate geometry (caller falls back). */
export function wowLayoutFor(
  arrangement: string,
  W: number,
  H: number,
  contentTop: number,
  n: number,
): WowLayout {
  const build = (): WowLayout => {
    switch (arrangement) {
      case 'classic': return classicWowLayout(W, H, contentTop, n);
      case 'pyramid': return pyramidWowLayout(W, H, contentTop, n);
      case 'mosaic': return mosaicWowLayout(W, H, contentTop, n);
      case 'magazine': return magazineWowLayout(W, H, contentTop, n);
      default: throw new Error(`wow geometry: no intentional layout for "${arrangement}"`);
    }
  };
  return assertLayout(enforceHeroDominance(build()));
}
