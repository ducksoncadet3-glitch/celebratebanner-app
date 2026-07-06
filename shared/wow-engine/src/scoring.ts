/**
 * WOW Score — the 100-point rubric (Design Bible Part 7), applied per concept.
 *
 *   Hero Strength 15 · Emotional Impact 20 · Storytelling 15 · Layout Balance 15
 *   Typography 10 · Color Harmony 10 · Luxury Finish 10 · Shareability 5
 *
 * Deterministic: derived only from the Memory Profile + Creative Brief + concept
 * identity. No randomness, no Date, no I/O. The 90 Rule is a hard gate.
 */
import type { MemoryProfile, CreativeBrief } from './types.ts';
import type { WowConceptName, WowScoreBreakdown } from './types.ts';
import { WOW_THRESHOLD } from './types.ts';

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
const round1 = (n: number): number => Math.round(n * 10) / 10;

const MAX = {
  heroStrength: 15, emotionalImpact: 20, storytelling: 15, layoutBalance: 15,
  typography: 10, colorHarmony: 10, luxuryFinish: 10, shareability: 5,
} as const;
type CatKey = keyof typeof MAX;

/** Per-concept category multipliers — how each concept's strengths differ (Design Bible Part 5). */
const MODIFIERS: Record<WowConceptName, Record<CatKey, number>> = {
  'Signature Edition': { heroStrength: 1.04, emotionalImpact: 1.0, storytelling: 1.0, layoutBalance: 1.08, typography: 1.06, colorHarmony: 1.04, luxuryFinish: 1.02, shareability: 1.0 },
  'Luxury Gold':       { heroStrength: 1.03, emotionalImpact: 1.06, storytelling: 0.98, layoutBalance: 1.02, typography: 1.04, colorHarmony: 1.06, luxuryFinish: 1.18, shareability: 1.02 },
  'Family Legacy':     { heroStrength: 1.0, emotionalImpact: 1.1, storytelling: 1.16, layoutBalance: 1.0, typography: 1.0, colorHarmony: 1.02, luxuryFinish: 1.0, shareability: 1.02 },
  'Modern Editorial':  { heroStrength: 1.02, emotionalImpact: 1.0, storytelling: 0.98, layoutBalance: 1.04, typography: 1.14, colorHarmony: 1.0, luxuryFinish: 0.98, shareability: 1.2 },
};

const EMOTIONAL_OCCASIONS = new Set(['graduation', 'championship', 'wedding', 'memorial', 'military', 'retirement', 'family_reunion']);
const SOCIAL_OCCASIONS = new Set(['social', 'senior_night', 'team', 'birthday']);

/** Base category fractions (0–1) from the shared signals, before per-concept modifiers. */
function baseFractions(profile: MemoryProfile, brief: CreativeBrief): Record<CatKey, number> {
  const hero = profile.hero_photo;
  const heroScore = hero ? hero.score / 100 : 0.5;
  const heroFaces = hero ? hero.faceCount : profile.primary_subject.faceCount;
  const dom = clamp01(brief.heroStrategy.dominanceRatio || 0.5);
  const suppCount = profile.supporting_photos.length;
  const groups = profile.groups.length;
  const conf = clamp01(((profile.confidence_score + brief.confidenceScore) / 2) / 100);
  const emoKeywords = Math.min(brief.emotionalDirection.keywords.length, 4) / 4;
  const colorFromPhotos = brief.colorDirection.source === 'photos';
  const whitespaceGenerous = /generous|breathing/i.test(brief.compositionDirection.whitespace);
  const overcrowd = brief.riskWarnings.some((r) => r.code === 'overcrowding_risk');
  const emotionalOccasion = EMOTIONAL_OCCASIONS.has(profile.occasion);
  const socialOccasion = SOCIAL_OCCASIONS.has(profile.occasion);

  const confFactor = 0.85 + 0.15 * conf; // low confidence gently pulls everything down

  return {
    heroStrength: clamp01(heroScore * 0.85 + dom * 0.15),
    emotionalImpact: clamp01((0.58 + heroScore * 0.2 + emoKeywords * 0.15 + (heroFaces > 0 ? 0.1 : 0) + (emotionalOccasion ? 0.04 : 0)) * confFactor),
    storytelling: clamp01(0.60 + Math.min(suppCount, 5) / 5 * 0.30 + Math.min(groups, 3) / 3 * 0.14),
    layoutBalance: clamp01((0.76 + dom * 0.08 + (suppCount > 0 ? 0.08 : 0) + (whitespaceGenerous ? 0.06 : 0) - (overcrowd ? 0.12 : 0)) * confFactor),
    typography: clamp01(0.85 + (brief.typographyDirection ? 0.08 : 0)),
    colorHarmony: clamp01((colorFromPhotos ? 0.90 : 0.82) + 0.05),
    luxuryFinish: clamp01(0.80 + (whitespaceGenerous ? 0.04 : 0)) * confFactor,
    shareability: clamp01(0.76 + (socialOccasion ? 0.14 : 0.08) + heroScore * 0.06),
  };
}

export function scoreConcept(
  concept: WowConceptName,
  profile: MemoryProfile,
  brief: CreativeBrief,
): { breakdown: WowScoreBreakdown; passed: boolean; reasons: string[] } {
  const base = baseFractions(profile, brief);
  const mod = MODIFIERS[concept];
  const cats = Object.keys(MAX) as CatKey[];

  const points: Record<CatKey, number> = {} as Record<CatKey, number>;
  let totalRaw = 0;
  for (const c of cats) {
    const frac = clamp01(base[c] * mod[c]);
    const p = frac * MAX[c];
    points[c] = round1(p);
    totalRaw += p;
  }
  const total = Math.round(totalRaw);

  const breakdown: WowScoreBreakdown = {
    heroStrength: points.heroStrength,
    emotionalImpact: points.emotionalImpact,
    storytelling: points.storytelling,
    layoutBalance: points.layoutBalance,
    typography: points.typography,
    colorHarmony: points.colorHarmony,
    luxuryFinish: points.luxuryFinish,
    shareability: points.shareability,
    total,
  };

  const passed = total >= WOW_THRESHOLD;
  const reasons: string[] = [];
  if (!passed) {
    reasons.push(`Overall WOW Score ${total} is below the ${WOW_THRESHOLD} gate.`);
    // Name the weakest categories (relative to their max) so the pipeline can regenerate wisely.
    const weakest = cats
      .map((c) => ({ c, ratio: points[c] / MAX[c] }))
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 2);
    for (const w of weakest) {
      reasons.push(`${label(w.c)} scored ${points[w.c]}/${MAX[w.c]} — strengthen this before revealing.`);
    }
    for (const r of brief.riskWarnings) {
      if (r.severity === 'warning') reasons.push(`Risk: ${r.message}`);
    }
  }

  return { breakdown, passed, reasons };
}

function label(c: CatKey): string {
  switch (c) {
    case 'heroStrength': return 'Hero Strength';
    case 'emotionalImpact': return 'Emotional Impact';
    case 'storytelling': return 'Storytelling';
    case 'layoutBalance': return 'Layout Balance';
    case 'typography': return 'Typography';
    case 'colorHarmony': return 'Color Harmony';
    case 'luxuryFinish': return 'Luxury Finish';
    case 'shareability': return 'Shareability';
  }
}
