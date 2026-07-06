/**
 * Builds a single WOW concept — a complete set of creative DECISIONS (no pixels).
 * Recipes are abstract instructions derived from the Creative Brief + concept
 * identity (Design Bible Part 5). The renderer later decides HOW to paint them.
 */
import type {
  MemoryProfile, CreativeBrief, WowConceptName, WowConcept,
  LayoutRecipe, ColorRecipe, TypographyRecipe,
} from './types.ts';
import { scoreConcept } from './scoring.ts';
import { creativeExplanation, purchasePsychology, sharePreview } from './explanations.ts';

const round2 = (n: number): number => Math.round(n * 100) / 100;
const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

const MAX_SUPPORTING: Record<WowConceptName, number> = {
  'Signature Edition': 4, 'Luxury Gold': 3, 'Family Legacy': 6, 'Modern Editorial': 4,
};

function heroDominance(concept: WowConceptName, brief: CreativeBrief): number {
  const base = clamp01(brief.heroStrategy.dominanceRatio || 0.55);
  switch (concept) {
    case 'Luxury Gold': return round2(Math.min(0.68, base + 0.06));
    case 'Family Legacy': return round2(Math.max(0.45, base - 0.06));
    case 'Modern Editorial': return round2(Math.min(0.66, base + 0.04));
    default: return round2(base);
  }
}

function layoutRecipe(concept: WowConceptName, brief: CreativeBrief): LayoutRecipe {
  const dom = heroDominance(concept, brief);
  const maxSupporting = MAX_SUPPORTING[concept];
  switch (concept) {
    case 'Signature Edition':
      return { arrangement: 'Central hero with a disciplined supporting grid', heroPlacement: 'centered', heroDominanceRatio: dom, supportingLayout: 'symmetrical grid beneath the hero', balance: 'symmetrical', whitespace: 'generous margins', focalPath: 'single clear centered path', maxSupporting };
    case 'Luxury Gold':
      return { arrangement: 'Dramatic spotlighted hero with luxurious negative space', heroPlacement: 'centered, spotlit', heroDominanceRatio: dom, supportingLayout: 'minimal framed supporting row', balance: 'symmetrical grandeur', whitespace: 'luxurious', focalPath: 'spotlight leads straight to the hero', maxSupporting };
    case 'Family Legacy':
      return { arrangement: 'Narrative gathered-memories flow', heroPlacement: 'anchored', heroDominanceRatio: dom, supportingLayout: 'tiered story clusters (anchors → builders → accents)', balance: 'balanced', whitespace: 'warm, room around every face', focalPath: 'hero first, then the journey', maxSupporting };
    case 'Modern Editorial':
      return { arrangement: 'Editorial asymmetry with an oversized hero', heroPlacement: 'off-center', heroDominanceRatio: dom, supportingLayout: 'off-grid supporting blocks', balance: 'deliberate asymmetry', whitespace: 'bold negative space', focalPath: 'scale-led diagonal path', maxSupporting };
  }
}

function colorRecipe(concept: WowConceptName, brief: CreativeBrief): ColorRecipe {
  const d = brief.colorDirection;
  const guidance: Record<WowConceptName, string> = {
    'Signature Edition': 'Restrained gold on obsidian; refined, high-contrast, timeless. Gold as a hairline accent only.',
    'Luxury Gold': 'Gold-forward on deep obsidian with glow accents on the hero — radiant metallic, never flooded.',
    'Family Legacy': 'Warm layer within the brand core; soft, unifying, nostalgic. Gold used as gentle detail.',
    'Modern Editorial': 'Sharpest contrast, a single disciplined accent; gold as highlight only.',
  };
  return {
    ground: d.primary, accent: d.accent, neutral: d.neutral,
    palette: d.palette.map((p) => ({ hex: p.hex, role: p.role })),
    source: d.source, guidance: guidance[concept],
  };
}

function typographyRecipe(concept: WowConceptName, brief: CreativeBrief): TypographyRecipe {
  const t = brief.typographyDirection;
  const spec: Record<WowConceptName, { headline: string; label: string; guidance: string }> = {
    'Signature Edition': { headline: 'elegant Cormorant Garamond display, high contrast, one headline', label: 'refined gold small-caps label', guidance: 'Classic, confident hierarchy; distance- and print-readable.' },
    'Luxury Gold': { headline: 'large Cormorant Garamond in gold gradient', label: 'letter-spaced small-caps gold label', guidance: 'Formal and radiant; the most decorative type voice, still restrained.' },
    'Family Legacy': { headline: 'warm classic serif display, approachable', label: 'humanist supporting labels, tasteful dates', guidance: 'Heartfelt, legible; room to breathe around names.' },
    'Modern Editorial': { headline: 'oversized confident display, tight tracking', label: 'bold sans labels; refined serif accent', guidance: 'Type as composition; strong scale contrast, magazine-grade.' },
  };
  const s = spec[concept];
  return { style: t.style, displayFont: t.displayFont, supportingFont: t.supportingFont, headlineTreatment: s.headline, labelTreatment: s.label, guidance: s.guidance };
}

function pickProduct(concept: WowConceptName, brief: CreativeBrief): string {
  const list = brief.productIntent.recommendedProducts ?? [];
  const primary = brief.productIntent.primaryProduct;
  const pref: Record<WowConceptName, string[]> = {
    'Signature Edition': [], 'Luxury Gold': ['Framed', 'Premium'], 'Family Legacy': ['Framed', 'Premium'], 'Modern Editorial': ['Digital', 'Social'],
  };
  for (const key of pref[concept]) {
    const m = list.find((p) => p.toLowerCase().includes(key.toLowerCase()));
    if (m) return m;
  }
  return primary || list[0] || 'Premium print';
}

export function buildConcept(
  concept: WowConceptName,
  profile: MemoryProfile,
  brief: CreativeBrief,
): WowConcept {
  const layout = layoutRecipe(concept, brief);
  const supportingPhotos = profile.supporting_photos.slice(0, layout.maxSupporting);
  const recommendedProduct = pickProduct(concept, brief);
  const { breakdown, passed, reasons } = scoreConcept(concept, profile, brief);

  return {
    conceptName: concept,
    title: brief.primaryMessage.suggestion,
    subtitle: brief.secondaryMessage.suggestion,
    creativeExplanation: creativeExplanation(concept, profile, brief),
    purchasePsychology: purchasePsychology(concept, profile, brief, recommendedProduct),
    heroPhoto: profile.hero_photo,
    supportingPhotos,
    layoutRecipe: layout,
    colorRecipe: colorRecipe(concept, brief),
    typographyRecipe: typographyRecipe(concept, brief),
    recommendedProduct,
    sharePreview: sharePreview(concept, profile, brief),
    wowScore: breakdown.total,
    masterpiecePassed: passed,
    scoreBreakdown: breakdown,
    failureReasons: reasons,
  };
}
