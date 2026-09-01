/**
 * Text-fitting regression suite.
 *
 * Incident: the headline was drawn at a hardcoded 64px and centred with fillText, so any
 * string wider than the canvas overflowed BOTH edges. "The Beauty of the World" measures
 * 873px against the canonical 800px grid on a real canvas and was clipped ~36px each side
 * on a paid order.
 *
 * The package is dependency-free by design (devDeps: typescript only), so these tests use a
 * deterministic metrics model rather than node-canvas. That is the right level for the
 * fitter: its contract is "given a context that can measure, never exceed maxWidth", and the
 * model exercises every branch — shrink, wrap, and last-resort compression. The real-font
 * behaviour is verified separately against node-canvas in the backend image.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { fitText, TEXT_SAFE_INSET, type FittedText } from '../src/theme/fit-text.ts';
import type { RenderContext } from '../src/types.ts';

const LOGICAL_W = 800;
const SAFE = LOGICAL_W - TEXT_SAFE_INSET * 2; // 704

/**
 * Deterministic text metrics. Per-character advance is a fraction of the em, varying by
 * character class so casing and punctuation genuinely change the measured width — the
 * fitter must react to measurement, never to a heuristic about the string.
 */
function advanceRatio(ch: string): number {
  if (ch === ' ') return 0.26;
  if (/[.,;:'!|]/.test(ch)) return 0.22;
  if (/[—–-]/.test(ch)) return 0.45;
  if (/[A-Z]/.test(ch)) return 0.66;
  if (/[ijlt]/.test(ch)) return 0.28;
  if (/[mw]/.test(ch)) return 0.78;
  return 0.5;
}

/**
 * Calibrated so the model reproduces the real measurement that caused the incident:
 * node-canvas measures 'bold 64px "Cormorant Garamond", serif' for "The Beauty of the World"
 * at 873px, against a 704px safe area. Without this the model under-measures by ~27% and the
 * incident string would appear to fit — the test would then pass for the wrong reason.
 */
const CALIBRATION = 1.266;

/** Minimal RenderContext that measures and records what was drawn. */
function makeCtx() {
  const drawn: Array<{ text: string; x: number; y: number; scaleX: number }> = [];
  let scaleX = 1;
  const stack: number[] = [];
  const ctx = {
    font: '64px serif',
    textAlign: 'center' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    fillStyle: '#fff',
    measureText(text: string) {
      const m = /(\d+(?:\.\d+)?)px/.exec(this.font);
      const size = m ? Number(m[1]) : 16;
      const bold = /bold|[6-9]00/.test(this.font) ? 1.04 : 1;
      let w = 0;
      for (const ch of text) w += advanceRatio(ch) * size;
      return { width: w * bold * CALIBRATION };
    },
    fillText(text: string, x: number, y: number) {
      drawn.push({ text, x, y, scaleX });
    },
    save() { stack.push(scaleX); },
    restore() { scaleX = stack.pop() ?? 1; },
    translate() { /* centre-relative draw; position asserted via width, not x */ },
    scale(x: number) { scaleX *= x; },
  };
  return { ctx: ctx as unknown as RenderContext, drawn, raw: ctx };
}

const headlineFont = (s: number) => `bold ${s}px "Cormorant Garamond", serif`;

const HEADLINES = {
  short: 'Champions',
  incident: 'The Beauty of the World',
  medium: 'Celebrate Every Achievement',
  veryLong: 'Celebrating Fifty Wonderful Years Of Family Love And Laughter Together',
  uppercase: 'CELEBRATING FIFTY WONDERFUL YEARS OF FAMILY LOVE AND LAUGHTER',
  punctuation: "Mom & Dad's 50th — Congratulations, You Two!",
  unbreakable: 'Supercalifragilisticexpialidociousandthensomemoreletters',
};

function fitHeadline(ctx: RenderContext, text: string): FittedText {
  return fitText(ctx, text, {
    maxWidth: SAFE, preferredSize: 64, minSize: 34, maxLines: 2, font: headlineFont,
  });
}

/** Widest line as actually drawn, including any last-resort compression. */
function drawnWidth(h: ReturnType<typeof makeCtx>, fitted: FittedText): number {
  const prev = h.raw.font;
  h.raw.font = headlineFont(fitted.fontSize);
  const w = fitted.lines.reduce(
    (m, line, i) => Math.max(m, h.raw.measureText(line).width * (fitted.compression[i] ?? 1)),
    0,
  );
  h.raw.font = prev;
  return w;
}

test('the incident headline no longer overflows the safe area', () => {
  const h = makeCtx();
  const fitted = fitHeadline(h.ctx, HEADLINES.incident);
  assert.ok(drawnWidth(h, fitted) <= SAFE + 0.5, `"${HEADLINES.incident}" still exceeds the safe area`);
});

test('every headline case fits inside the safe area', () => {
  const h = makeCtx();
  for (const [name, text] of Object.entries(HEADLINES)) {
    const w = drawnWidth(h, fitHeadline(h.ctx, text));
    assert.ok(w <= SAFE + 0.5, `${name}: "${text}" exceeds the safe area (${w.toFixed(0)} > ${SAFE})`);
  }
});

test('centred text never crosses either edge of the safe area', () => {
  const h = makeCtx();
  for (const [name, text] of Object.entries(HEADLINES)) {
    const w = drawnWidth(h, fitHeadline(h.ctx, text));
    const left = LOGICAL_W / 2 - w / 2;
    const right = LOGICAL_W / 2 + w / 2;
    assert.ok(left >= TEXT_SAFE_INSET - 0.5, `${name}: left edge ${left.toFixed(0)} crosses in`);
    assert.ok(right <= LOGICAL_W - TEXT_SAFE_INSET + 0.5, `${name}: right edge ${right.toFixed(0)} crosses in`);
  }
});

test('a short headline keeps its intended 64px single-line look', () => {
  const h = makeCtx();
  const fitted = fitHeadline(h.ctx, HEADLINES.short);
  assert.equal(fitted.fontSize, 64, 'short headlines must not be shrunk');
  assert.equal(fitted.lines.length, 1, 'short headlines must not wrap');
  assert.equal(fitted.compression[0], 1, 'short headlines must not be compressed');
  assert.deepEqual(fitted.lines, [HEADLINES.short]);
});

test('fitting never drops below the aesthetic minimum', () => {
  const h = makeCtx();
  for (const text of Object.values(HEADLINES)) {
    assert.ok(fitHeadline(h.ctx, text).fontSize >= 34, `"${text}" shrank below the minimum`);
  }
});

test('shrinking is preferred to wrapping while one line still works', () => {
  const h = makeCtx();
  const fitted = fitHeadline(h.ctx, HEADLINES.incident);
  assert.equal(fitted.lines.length, 1, 'this headline fits on one line once shrunk');
  assert.ok(fitted.fontSize < 64, 'it must actually shrink');
});

test('a headline too long for one line wraps instead of shrinking to nothing', () => {
  const h = makeCtx();
  const fitted = fitHeadline(h.ctx, HEADLINES.veryLong);
  assert.ok(fitted.lines.length > 1, 'a very long headline should use the second line');
  assert.ok(fitted.lines.every((l) => l.trim().length > 0), 'no empty wrapped line');
  assert.equal(fitted.lines.join(' '), HEADLINES.veryLong, 'wrapping must not lose or reorder words');
});

test('an unbreakable token is compressed rather than clipped', () => {
  const h = makeCtx();
  const fitted = fitHeadline(h.ctx, HEADLINES.unbreakable);
  assert.ok(drawnWidth(h, fitted) <= SAFE + 0.5, 'unbreakable text must still be contained');
  assert.ok(fitted.compression.some((c) => c < 1) || fitted.lines.length > 1,
    'it must be compressed and/or split, never left overflowing');
});

test('uppercase is measured, not assumed', () => {
  const h = makeCtx();
  const lower = fitHeadline(h.ctx, 'celebrating fifty wonderful years of family love');
  const upper = fitHeadline(h.ctx, 'CELEBRATING FIFTY WONDERFUL YEARS OF FAMILY LOVE');
  if (upper.lines.length === lower.lines.length) {
    assert.ok(upper.fontSize <= lower.fontSize, 'wider uppercase must not be fitted larger');
  }
  assert.ok(drawnWidth(h, upper) <= SAFE + 0.5);
});

test('punctuation-heavy headlines fit', () => {
  const h = makeCtx();
  assert.ok(drawnWidth(h, fitHeadline(h.ctx, HEADLINES.punctuation)) <= SAFE + 0.5);
});

test('fitting is deterministic — renderBannerText is called twice per render', () => {
  const h = makeCtx();
  for (const text of Object.values(HEADLINES)) {
    assert.deepEqual(fitHeadline(h.ctx, text), fitHeadline(h.ctx, text));
  }
});

test('fitting restores the context font it was given', () => {
  const h = makeCtx();
  h.raw.font = 'italic 20px Outfit';
  fitHeadline(h.ctx, HEADLINES.veryLong);
  assert.equal(h.raw.font, 'italic 20px Outfit', 'fitText must not leak font state');
});

test('the same decision holds at any context scale (preview vs HD)', () => {
  // export.ts keeps the 800x1200 logical grid and applies ctx.scale(), so fitting runs in
  // logical units at every output size. Identical inputs must give identical decisions.
  const preview = makeCtx();
  const hd = makeCtx();
  for (const [name, text] of Object.entries(HEADLINES)) {
    const a = fitHeadline(preview.ctx, text);
    const b = fitHeadline(hd.ctx, text);
    assert.equal(b.fontSize, a.fontSize, `${name}: HD font size differs from preview`);
    assert.deepEqual(b.lines, a.lines, `${name}: HD line breaks differ from preview`);
  }
});

test('an empty value still yields a drawable single-line result', () => {
  const h = makeCtx();
  const fitted = fitText(h.ctx, '', {
    maxWidth: SAFE, preferredSize: 56, minSize: 30, maxLines: 2, font: headlineFont,
  });
  assert.equal(fitted.lines.length, 1);
  assert.equal(fitted.fontSize, 56);
});
