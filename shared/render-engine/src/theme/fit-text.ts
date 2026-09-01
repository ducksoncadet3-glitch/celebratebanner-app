import type { RenderContext } from '../types.js';

/**
 * Text fitting for editable banner fields.
 *
 * Every editable string is customer-supplied, so no fixed font size is safe: the headline
 * was drawn at a hardcoded 64px and centred with fillText, which silently overflowed BOTH
 * edges once the string was wider than the canvas ("The Beauty of the World" measures 873px
 * in the canonical 800px grid — ~36px off each side).
 *
 * The fitter measures with the SAME context and the SAME font string that will be used to
 * draw, so whatever affects advance width — family, weight, style, letterSpacing, casing,
 * punctuation, kerning — is accounted for by construction rather than estimated.
 *
 * HD export reuses this automatically: pipeline/export.ts keeps the canonical 800x1200
 * layout grid and applies ctx.scale(), so preview and print run identical fitting math and
 * cannot disagree.
 */

/**
 * Horizontal inset of the text safe area, in canonical 800x1200 layout units (~6% a side).
 * Glyphs never cross it. HD export scales the whole grid, so this is resolution-independent.
 */
export const TEXT_SAFE_INSET = 48;

export interface FitTextOptions {
  /** Usable width. Glyphs must never cross this. */
  maxWidth: number;
  /** The template's intended size. Text that already fits is drawn at exactly this size. */
  preferredSize: number;
  /** Aesthetic floor: the fitter will not shrink below this to win space. */
  minSize: number;
  /** Max lines this region can occupy. 1 = never wrap. */
  maxLines?: number;
  /** Builds the full CSS font string for a size, e.g. (s) => `bold ${s}px serif`. */
  font: (size: number) => string;
  /** Search granularity in px. */
  step?: number;
}

export interface FittedText {
  fontSize: number;
  lines: string[];
  /**
   * Per-line horizontal compression (1 = none). Last-resort guarantee for pathological
   * input — e.g. a single unbreakable 60-character token — so the no-clipping invariant
   * holds even when shrinking and wrapping are exhausted.
   */
  compression: number[];
}

/** Greedy word wrap into at most `maxLines`; returns null if the text cannot fit. */
function wrapInto(
  ctx: RenderContext,
  text: string,
  maxLines: number,
  maxWidth: number,
): string[] | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length > maxLines) return null;
    }
  }
  lines.push(current);
  if (lines.length > maxLines) return null;
  return lines;
}

function widest(ctx: RenderContext, lines: string[]): number {
  return lines.reduce((m, l) => Math.max(m, ctx.measureText(l).width), 0);
}

/**
 * Find the largest size at or below `preferredSize` whose text fits inside `maxWidth`.
 *
 * Order of preference, so a short headline is never altered and a long one degrades
 * gracefully rather than abruptly:
 *   1. preferred size, one line          → the template's intended look
 *   2. shrink toward minSize, one line   → keeps the single-line composition
 *   3. preferred size, wrapped           → full size, more lines
 *   4. shrink toward minSize, wrapped
 *   5. minSize + wrapped + compression   → last resort; never clips
 */
export function fitText(ctx: RenderContext, text: string, opts: FitTextOptions): FittedText {
  const { maxWidth, preferredSize, minSize, font } = opts;
  const maxLines = Math.max(1, opts.maxLines ?? 1);
  const step = Math.max(1, opts.step ?? 2);
  const value = text.trim();

  if (!value) return { fontSize: preferredSize, lines: [''], compression: [1] };

  const prevFont = ctx.font;
  try {
    // Passes 1+2 then 3+4: try every size on N lines before allowing N+1 lines, so we only
    // wrap when shrinking alone cannot do it.
    for (let lineBudget = 1; lineBudget <= maxLines; lineBudget++) {
      for (let size = preferredSize; size >= minSize; size -= step) {
        ctx.font = font(size);
        const lines = wrapInto(ctx, value, lineBudget, maxWidth);
        if (lines && widest(ctx, lines) <= maxWidth) {
          return { fontSize: size, lines, compression: lines.map(() => 1) };
        }
      }
    }

    // Pass 5: shrinking and wrapping are both exhausted. Lay the text out at minSize within
    // the line budget WITHOUT clipping, then compress any line that is still too wide.
    // Word boundaries are preserved — only a single unbreakable token is ever character-split.
    ctx.font = font(minSize);
    const lines = clampToLines(ctx, value, maxLines, maxWidth);
    const compression = lines.map((l) => {
      const w = ctx.measureText(l).width;
      return w > maxWidth ? maxWidth / w : 1;
    });
    return { fontSize: minSize, lines, compression };
  } finally {
    ctx.font = prevFont;
  }
}

/**
 * Lay text out in AT MOST `maxLines`, never dropping a word. Lines before the last break on
 * width as usual; the final line absorbs whatever remains and is compressed by the caller if
 * it overflows. A single unbreakable token has no word boundary to use, so it — and only it —
 * is split by characters.
 */
function clampToLines(
  ctx: RenderContext,
  text: string,
  maxLines: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  if (words.length === 1) return splitToken(words[0], maxLines);

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const onLastLine = lines.length === maxLines - 1;
    if (onLastLine || !current || ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  lines.push(current);
  return lines;
}

/** Character-split a single unbreakable token into `maxLines` roughly equal chunks. */
function splitToken(token: string, maxLines: number): string[] {
  const per = Math.ceil(token.length / maxLines);
  const out: string[] = [];
  for (let i = 0; i < token.length; i += per) out.push(token.slice(i, i + per));
  return out.slice(0, maxLines);
}

/**
 * Draw a fitted block centred on `centerX`, first baseline at `firstBaselineY`.
 * Returns the baseline Y of the last line so callers can advance layout.
 */
export function drawFittedText(
  ctx: RenderContext,
  fitted: FittedText,
  centerX: number,
  firstBaselineY: number,
  lineHeight: number,
): number {
  let y = firstBaselineY;
  fitted.lines.forEach((line, i) => {
    const squeeze = fitted.compression[i] ?? 1;
    if (squeeze < 1) {
      // Compress about the centre so the block stays centred.
      ctx.save();
      ctx.translate(centerX, y);
      ctx.scale(squeeze, 1);
      ctx.fillText(line, 0, 0);
      ctx.restore();
    } else {
      ctx.fillText(line, centerX, y);
    }
    if (i < fitted.lines.length - 1) y += lineHeight;
  });
  return y;
}
