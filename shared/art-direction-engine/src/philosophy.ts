/**
 * The four visual identities. Each is a different creative agency brief — not a
 * template variant. Every field below is a DECISION the renderer then executes.
 *
 *   Signature Edition — luxury museum print: symmetrical, elegant, quiet confidence.
 *   Luxury Gold       — high-end editorial: fashion magazine, bold contrast, drama.
 *   Family Legacy     — emotional storytelling: a layered photo journey, family first.
 *   Modern Editorial  — magazine cover: negative space, large headlines, minimalist.
 */
import type {
  WowConceptName, CompositionPhilosophy, WhitespaceStrategy, HeroEmphasis,
  SupportingRhythm, TypographyHierarchy, ArtPalette, RenderTreatment, FramingStyle,
} from './types.ts';

export interface Identity {
  philosophy: CompositionPhilosophy;
  whitespace: WhitespaceStrategy;
  /** Base hero dominance; blended with the brief, then clamped to 0.55–0.70. */
  heroDominanceBase: number;
  framingStyle: FramingStyle;
  heroSpotlight: boolean;
  heroCinematic: boolean;
  heroFrame: string;
  supporting: SupportingRhythm;
  typography: TypographyHierarchy;
  palette: ArtPalette;
  luxuryLevel: number;
  emotionalIntensity: number;
  treatment: RenderTreatment;
}

export const IDENTITIES: Record<WowConceptName, Identity> = {
  'Signature Edition': {
    philosophy: {
      thesis: 'A luxury museum print — symmetry, restraint, and quiet confidence.',
      balance: 'symmetrical',
      visualHierarchy: ['hero portrait', 'title', 'supporting grid', 'gold hairline'],
      focalPath: 'A single centred axis: the eye lands on the hero and stays.',
    },
    whitespace: { level: 'generous', marginRatio: 0.075, gutterRatio: 0.022, rationale: 'Gallery margins let the hero breathe; nothing crowds the frame.' },
    heroDominanceBase: 0.68,
    framingStyle: 'museum',
    heroSpotlight: false,
    heroCinematic: true,
    heroFrame: 'thin-gold',
    supporting: { count: 4, cadence: 'even', aspect: 1, gapRatio: 0.022, rationale: 'Four evenly weighted memories — a disciplined predella beneath the hero.' },
    typography: {
      style: 'museum serif', displayFont: 'Cormorant Garamond', supportingFont: 'Outfit',
      displayScale: 1.0, tracking: '0.01em', casing: 'title', alignment: 'center',
      headlineTreatment: 'Centred display serif with generous leading',
      labelTreatment: 'Small caps, wide tracking, muted',
    },
    palette: { ground: '#0C0E14', accent: '#C9A84C', neutral: '#FAF8F3', rationale: 'Obsidian ground, champagne gold used sparingly, ivory type.' },
    luxuryLevel: 88,
    emotionalIntensity: 62,
    treatment: { grade: { contrast: 1.02, saturate: 0.98, brightness: 1.0 }, vignette: 0.18, heroFrame: 'thin-gold', supportingAspect: 1, cinematicHero: true },
  },

  'Luxury Gold': {
    philosophy: {
      thesis: 'High-end editorial — fashion-magazine drama, gold at full voice.',
      balance: 'editorial',
      visualHierarchy: ['spotlit hero', 'oversized title', 'gold accents', 'few supporting'],
      focalPath: 'A spotlight pulls the eye to the hero, then the gold carries it down.',
    },
    whitespace: { level: 'dramatic', marginRatio: 0.055, gutterRatio: 0.018, rationale: 'Tight margins press the drama toward the edges of the page.' },
    heroDominanceBase: 0.66,
    framingStyle: 'cinematic',
    heroSpotlight: true,
    heroCinematic: true,
    heroFrame: 'gold',
    supporting: { count: 3, cadence: 'sparse', aspect: 1, gapRatio: 0.018, rationale: 'Only three supporting frames — scarcity is what makes the hero feel expensive.' },
    typography: {
      style: 'editorial display', displayFont: 'Cormorant Garamond', supportingFont: 'Outfit',
      displayScale: 1.18, tracking: '0.04em', casing: 'upper', alignment: 'center',
      headlineTreatment: 'Oversized display caps with wide tracking',
      labelTreatment: 'Gold small caps',
    },
    palette: { ground: '#0A0A0A', accent: '#E8C97A', neutral: '#FFFFFF', rationale: 'Near-black ground, bright gold at full saturation, pure white type.' },
    luxuryLevel: 96,
    emotionalIntensity: 70,
    treatment: { grade: { contrast: 1.18, saturate: 1.05, brightness: 0.96 }, vignette: 0.38, heroFrame: 'gold', supportingAspect: 1, cinematicHero: true },
  },

  'Family Legacy': {
    philosophy: {
      thesis: 'Emotional storytelling — a layered photo journey, family first.',
      balance: 'layered',
      visualHierarchy: ['hero', 'story of supporting photos', 'warm ground', 'title'],
      focalPath: 'The hero anchors, then the eye walks the story left to right.',
    },
    whitespace: { level: 'controlled', marginRatio: 0.05, gutterRatio: 0.026, rationale: 'Closer spacing gathers the memories together, like photographs on a mantel.' },
    heroDominanceBase: 0.58,
    framingStyle: 'intimate',
    heroSpotlight: false,
    heroCinematic: false,
    heroFrame: 'soft',
    supporting: { count: 6, cadence: 'journey', aspect: 1, gapRatio: 0.026, rationale: 'Six memories in narrative order — the story matters as much as the hero.' },
    typography: {
      style: 'warm humanist', displayFont: 'Cormorant Garamond', supportingFont: 'Outfit',
      displayScale: 0.94, tracking: '0.005em', casing: 'title', alignment: 'center',
      headlineTreatment: 'Softer display serif, tighter leading',
      labelTreatment: 'Warm sentence case',
    },
    palette: { ground: '#1A1410', accent: '#C98B4C', neutral: '#F5EDE2', rationale: 'Warm brown-black ground, amber accent, cream type — a family album.' },
    luxuryLevel: 74,
    emotionalIntensity: 92,
    treatment: { grade: { contrast: 1.04, saturate: 1.08, brightness: 1.02 }, vignette: 0.22, heroFrame: 'soft', supportingAspect: 1, cinematicHero: false },
  },

  'Modern Editorial': {
    philosophy: {
      thesis: 'A magazine cover — negative space, a large headline, nothing spare.',
      balance: 'asymmetrical',
      visualHierarchy: ['headline', 'off-centre hero', 'negative space', 'two supporting'],
      focalPath: 'The headline enters first, the hero answers it from the left.',
    },
    whitespace: { level: 'expansive', marginRatio: 0.09, gutterRatio: 0.03, rationale: 'Negative space is the subject: the emptiness is what reads as contemporary.' },
    heroDominanceBase: 0.62,
    framingStyle: 'editorial',
    heroSpotlight: false,
    heroCinematic: false,
    heroFrame: 'minimal',
    supporting: { count: 3, cadence: 'crescendo', aspect: 1, gapRatio: 0.03, rationale: 'Three frames, generously spaced — restraint is the whole point.' },
    typography: {
      style: 'contemporary minimal', displayFont: 'Cormorant Garamond', supportingFont: 'Outfit',
      displayScale: 1.12, tracking: '-0.01em', casing: 'title', alignment: 'left',
      headlineTreatment: 'Large left-aligned display with tight tracking',
      labelTreatment: 'Uppercase micro-labels',
    },
    palette: { ground: '#101216', accent: '#FAF8F3', neutral: '#9AA0A6', rationale: 'Cool ink ground, ivory as the accent, grey type — light is the accent, not gold.' },
    luxuryLevel: 80,
    emotionalIntensity: 54,
    treatment: { grade: { contrast: 1.10, saturate: 0.80, brightness: 1.04 }, vignette: 0.10, heroFrame: 'minimal', supportingAspect: 1, cinematicHero: false },
  },
};

/** Clamp any requested dominance into the mandated 55–70% band. */
export function clampHeroDominance(value: number, floor = 0.55, ceiling = 0.70): number {
  if (!Number.isFinite(value)) return floor;
  return Math.min(ceiling, Math.max(floor, Math.round(value * 1000) / 1000));
}

export function heroEmphasisFor(name: WowConceptName, briefDominance: number): HeroEmphasis {
  const id = IDENTITIES[name];
  const brief = Number.isFinite(briefDominance) ? briefDominance : 0.5;
  // The identity leads; the brief nudges. Always inside the mandated band.
  const dominanceRatio = clampHeroDominance(id.heroDominanceBase + (brief - 0.5) * 0.1);
  return {
    dominanceRatio,
    framing: id.framingStyle,
    spotlight: id.heroSpotlight,
    cinematic: id.heroCinematic,
    frame: id.heroFrame,
    fillsFrame: true,
  };
}
