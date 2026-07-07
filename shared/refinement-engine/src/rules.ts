/**
 * Rules — one entry per refinement intent. Each rule declares:
 *   • label + summary (human-readable)
 *   • scoreDelta — bounded per-category adjustments to the WOW Score breakdown
 *   • apply(concept, brief) — deterministic edits to the concept's creative recipes,
 *     returning the field changes (never touches names, photos, or their order)
 *   • conflictsWith — intents whose creative direction contradicts this one
 *   • ornament — whether the intent adds visual ornament (used for clutter control)
 *
 * All edits are bounded and reversible; nothing here paints pixels.
 */
import type { WowConcept, CreativeBrief, RefinementIntent, ScoreCategory, FieldChange } from './types.ts';

export interface RefinementRule {
  label: string;
  summary: string;
  scoreDelta: Partial<Record<ScoreCategory, number>>;
  conflictsWith: RefinementIntent[];
  ornament: boolean;
  /** Mutates the (already-cloned) concept and returns the field changes. */
  apply: (concept: WowConcept, brief: CreativeBrief) => FieldChange[];
}

// ── recipe-edit helpers (deterministic; capture from/to) ──────────────────────
function appendGuidance(obj: { guidance: string }, field: string, note: string, changes: FieldChange[]): void {
  const from = obj.guidance;
  if (from.includes(note)) return; // idempotent
  obj.guidance = from ? `${from} ${note}` : note;
  changes.push({ field, from, to: obj.guidance });
}
function setStr<T extends Record<K, string>, K extends string>(obj: T, key: K, to: string, field: string, changes: FieldChange[]): void {
  const from = obj[key];
  if (from === to) return;
  obj[key] = to as T[K];
  changes.push({ field, from, to });
}

export const REFINEMENT_RULES: Record<RefinementIntent, RefinementRule> = {
  luxury: {
    label: 'More luxurious',
    summary: 'Deepen the gold, add restraint and finish so the piece reads richer.',
    scoreDelta: { luxuryFinish: 2.5, colorHarmony: 1.0, emotionalImpact: 0.5 },
    conflictsWith: [],
    ornament: false,
    apply: (c, _b) => {
      const ch: FieldChange[] = [];
      appendGuidance(c.colorRecipe, 'colorRecipe.guidance', 'Refined toward a richer, more opulent gold with disciplined contrast.', ch);
      setStr(c.typographyRecipe, 'headlineTreatment', `${c.typographyRecipe.headlineTreatment} · elevated`, 'typographyRecipe.headlineTreatment', ch);
      setStr(c.layoutRecipe, 'whitespace', 'generous, gallery-grade margins', 'layoutRecipe.whitespace', ch);
      return ch;
    },
  },
  elegance: {
    label: 'More elegant',
    summary: 'Add refinement and calm; let the composition breathe.',
    scoreDelta: { luxuryFinish: 1.5, typography: 1.0, layoutBalance: 0.8 },
    conflictsWith: [],
    ornament: false,
    apply: (c) => {
      const ch: FieldChange[] = [];
      setStr(c.typographyRecipe, 'style', 'refined editorial elegance', 'typographyRecipe.style', ch);
      setStr(c.layoutRecipe, 'whitespace', 'generous, unhurried', 'layoutRecipe.whitespace', ch);
      return ch;
    },
  },
  modern: {
    label: 'More modern',
    summary: 'Sharpen typography and asymmetry for a contemporary, editorial feel.',
    scoreDelta: { typography: 2.0, shareability: 1.2, luxuryFinish: -0.6 },
    conflictsWith: ['classic'],
    ornament: false,
    apply: (c) => {
      const ch: FieldChange[] = [];
      setStr(c.typographyRecipe, 'style', 'modern editorial', 'typographyRecipe.style', ch);
      setStr(c.layoutRecipe, 'balance', 'deliberate editorial asymmetry', 'layoutRecipe.balance', ch);
      return ch;
    },
  },
  classic: {
    label: 'More classic',
    summary: 'Center the composition and lean into timeless symmetry.',
    scoreDelta: { layoutBalance: 1.8, colorHarmony: 0.6, shareability: -0.5 },
    conflictsWith: ['modern'],
    ornament: false,
    apply: (c) => {
      const ch: FieldChange[] = [];
      setStr(c.typographyRecipe, 'style', 'timeless classic', 'typographyRecipe.style', ch);
      setStr(c.layoutRecipe, 'balance', 'symmetrical', 'layoutRecipe.balance', ch);
      return ch;
    },
  },
  minimal: {
    label: 'More minimal',
    summary: 'Strip ornament, widen whitespace, let the hero stand alone.',
    scoreDelta: { layoutBalance: 1.2, luxuryFinish: 1.0, typography: 0.6 },
    conflictsWith: ['decoration', 'celebration', 'energy'],
    ornament: false,
    apply: (c) => {
      const ch: FieldChange[] = [];
      setStr(c.layoutRecipe, 'whitespace', 'expansive, minimalist', 'layoutRecipe.whitespace', ch);
      appendGuidance(c.colorRecipe, 'colorRecipe.guidance', 'Pared back to essentials — no added ornament.', ch);
      return ch;
    },
  },
  celebration: {
    label: 'More celebratory',
    summary: 'Warm the palette and lift the mood without losing polish.',
    scoreDelta: { emotionalImpact: 1.8, shareability: 1.2, luxuryFinish: -0.6 },
    conflictsWith: ['minimal'],
    ornament: true,
    apply: (c) => {
      const ch: FieldChange[] = [];
      appendGuidance(c.colorRecipe, 'colorRecipe.guidance', 'Warmed toward a festive, joyful register while keeping the palette disciplined.', ch);
      return ch;
    },
  },
  'hero-emphasis': {
    label: 'Emphasize the hero',
    summary: 'Increase the hero’s dominance and spotlight (never reduce it).',
    scoreDelta: { heroStrength: 2.5, layoutBalance: 0.4 },
    conflictsWith: [],
    ornament: false,
    apply: (c) => {
      const ch: FieldChange[] = [];
      // The engine raises heroDominanceRatio (bounded); record placement intent here.
      setStr(c.layoutRecipe, 'heroPlacement', 'commanding center stage with a soft spotlight', 'layoutRecipe.heroPlacement', ch);
      return ch;
    },
  },
  typography: {
    label: 'Refine typography',
    summary: 'Elevate the type treatment and hierarchy.',
    scoreDelta: { typography: 2.5 },
    conflictsWith: [],
    ornament: false,
    apply: (c) => {
      const ch: FieldChange[] = [];
      appendGuidance(c.typographyRecipe, 'typographyRecipe.guidance', 'Tightened hierarchy and letterforms for a crisper headline.', ch);
      return ch;
    },
  },
  color: {
    label: 'Harmonize color',
    summary: 'Tune the palette for stronger harmony.',
    scoreDelta: { colorHarmony: 2.5 },
    conflictsWith: [],
    ornament: false,
    apply: (c) => {
      const ch: FieldChange[] = [];
      appendGuidance(c.colorRecipe, 'colorRecipe.guidance', 'Rebalanced hues for a more harmonious, cohesive palette.', ch);
      return ch;
    },
  },
  decoration: {
    label: 'Add tasteful decoration',
    summary: 'Introduce restrained, occasion-appropriate ornament from the brief allowlist.',
    scoreDelta: { colorHarmony: 0.6, emotionalImpact: 0.6, luxuryFinish: -0.4 },
    conflictsWith: ['minimal'],
    ornament: true,
    apply: (c, b) => {
      const ch: FieldChange[] = [];
      const allowed = Array.isArray(b.decorativeDirection?.allowed) ? b.decorativeDirection.allowed.slice(0, 3) : [];
      const note = allowed.length
        ? `Added restrained ornament from the brief allowlist (${allowed.join(', ')}).`
        : 'Requested ornament, but the brief allows none for this occasion.';
      appendGuidance(c.colorRecipe, 'colorRecipe.guidance', note, ch);
      return ch;
    },
  },
  lighting: {
    label: 'Enhance lighting',
    summary: 'Add a soft spotlight and vignette to lift the hero.',
    scoreDelta: { luxuryFinish: 1.8, heroStrength: 0.6 },
    conflictsWith: [],
    ornament: false,
    apply: (c) => {
      const ch: FieldChange[] = [];
      appendGuidance(c.colorRecipe, 'colorRecipe.guidance', 'Introduced a soft spotlight and gentle vignette to draw the eye to the hero.', ch);
      return ch;
    },
  },
  emotion: {
    label: 'Heighten emotion',
    summary: 'Deepen the emotional tone of the piece.',
    scoreDelta: { emotionalImpact: 2.5 },
    conflictsWith: [],
    ornament: false,
    apply: (c) => {
      const ch: FieldChange[] = [];
      appendGuidance(c.typographyRecipe, 'typographyRecipe.guidance', 'Softened the tone to feel warmer and more heartfelt.', ch);
      return ch;
    },
  },
  background: {
    label: 'Refine background',
    summary: 'Deepen the backdrop for more depth and separation.',
    scoreDelta: { colorHarmony: 0.8, luxuryFinish: 0.8 },
    conflictsWith: [],
    ornament: false,
    apply: (c) => {
      const ch: FieldChange[] = [];
      appendGuidance(c.colorRecipe, 'colorRecipe.guidance', 'Deepened the background for more depth and cleaner subject separation.', ch);
      return ch;
    },
  },
  energy: {
    label: 'More energy',
    summary: 'Add dynamism and punch for a bolder, more shareable read.',
    scoreDelta: { shareability: 2.0, emotionalImpact: 0.6, layoutBalance: -0.8 },
    conflictsWith: ['minimal'],
    ornament: false,
    apply: (c) => {
      const ch: FieldChange[] = [];
      setStr(c.layoutRecipe, 'focalPath', 'dynamic, high-energy focal path', 'layoutRecipe.focalPath', ch);
      return ch;
    },
  },
};
