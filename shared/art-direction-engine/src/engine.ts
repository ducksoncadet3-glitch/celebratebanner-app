/**
 * The Art Direction Engine — public entry point.
 *
 *   directArt(memoryProfile, creativeBrief, wowPresentation, options?) → ArtDirectionResult
 *
 * Takes the four concepts the WOW Engine chose and gives each one a genuinely distinct
 * artistic identity, then re-writes the presentation's creative recipes so the existing
 * Render Orchestrator (untouched) translates that direction into renderer instructions.
 *
 * It DECIDES; the renderer EXECUTES. Deterministic — no Date, no random, no I/O, no
 * pixels. Photo ORDER changes only with a recorded narrative justification; no photo is
 * ever dropped, renamed, or invented.
 */
import type {
  MemoryProfile, CreativeBrief, WowPresentation, WowConcept, WowConceptName,
  ArtDirection, ArtDirectionResult, DirectArtOptions,
} from './types.ts';
import { SCHEMA_VERSION } from './types.ts';
import { IDENTITIES, heroEmphasisFor } from './philosophy.ts';
import { orderPhotoStory } from './story.ts';
import { copyFor } from './copy.ts';

const clone = <T>(v: T): T => structuredClone(v);

function directionFor(concept: WowConcept, brief: CreativeBrief, occasion: string, options: DirectArtOptions): ArtDirection {
  const name = concept.conceptName as WowConceptName;
  const id = IDENTITIES[name];
  const hero = heroEmphasisFor(name, brief.heroStrategy?.dominanceRatio ?? 0.5);

  // Supporting photos become a story; we never show more than this identity's rhythm.
  const story = orderPhotoStory(concept.supportingPhotos, occasion, options.beats);
  const supporting = { ...id.supporting, count: Math.min(id.supporting.count, story.ordered.length || id.supporting.count) };

  const partial: Omit<ArtDirection, 'copy'> = {
    conceptName: name,
    philosophy: id.philosophy,
    whitespace: id.whitespace,
    hero,
    supporting,
    typography: id.typography,
    palette: id.palette,
    luxuryLevel: id.luxuryLevel,
    emotionalIntensity: id.emotionalIntensity,
    framingStyle: id.framingStyle,
    storytellingFlow: story.flow,
    treatment: { ...id.treatment, heroFrame: hero.frame, supportingAspect: id.supporting.aspect, cinematicHero: hero.cinematic },
  };
  return { ...partial, copy: copyFor(partial, occasion) };
}

/** Re-write a concept's recipes so the untouched orchestrator renders this direction. */
function applyDirection(concept: WowConcept, d: ArtDirection, occasion: string, options: DirectArtOptions): WowConcept {
  const out = clone(concept);
  const story = orderPhotoStory(concept.supportingPhotos, occasion, options.beats);

  out.supportingPhotos = story.ordered;                 // narrative order, nothing dropped

  out.layoutRecipe = {
    ...out.layoutRecipe,
    arrangement: d.philosophy.thesis,
    heroPlacement: `${d.hero.framing} framing, fills the frame`,
    heroDominanceRatio: d.hero.dominanceRatio,          // always 0.55–0.70
    supportingLayout: `${d.supporting.cadence} rhythm of ${d.supporting.count}`,
    balance: d.philosophy.balance,
    whitespace: `${d.whitespace.level} — ${d.whitespace.rationale}`,
    focalPath: d.philosophy.focalPath,
    maxSupporting: d.supporting.count,                  // rhythm: how many are drawn
  };

  out.colorRecipe = {
    ...out.colorRecipe,
    ground: d.palette.ground,
    accent: d.palette.accent,
    neutral: d.palette.neutral,
    palette: [
      { hex: d.palette.ground, role: 'ground' },
      { hex: d.palette.accent, role: 'accent' },
      { hex: d.palette.neutral, role: 'neutral' },
    ],
    guidance: d.palette.rationale,
  };

  out.typographyRecipe = {
    ...out.typographyRecipe,
    style: d.typography.style,
    displayFont: d.typography.displayFont,
    supportingFont: d.typography.supportingFont,
    headlineTreatment: d.typography.headlineTreatment,
    labelTreatment: d.typography.labelTreatment,
    guidance: `${d.philosophy.thesis} Alignment ${d.typography.alignment}, tracking ${d.typography.tracking}.`,
  };

  return out;
}

export function directArt(
  memoryProfile: MemoryProfile,
  creativeBrief: CreativeBrief,
  wowPresentation: WowPresentation,
  options: DirectArtOptions = {},
): ArtDirectionResult {
  const occasion = String(memoryProfile.occasion ?? 'unknown');

  const directions = wowPresentation.concepts
    .filter((c) => IDENTITIES[c.conceptName as WowConceptName])
    .map((c) => directionFor(c, creativeBrief, occasion, options));

  const byName = new Map(directions.map((d) => [d.conceptName, d]));
  const presentation: WowPresentation = clone(wowPresentation);
  presentation.concepts = presentation.concepts.map((c) => {
    const d = byName.get(c.conceptName as WowConceptName);
    return d ? applyDirection(c, d, occasion, options) : c;
  });

  return { schemaVersion: SCHEMA_VERSION, occasion, directions, presentation };
}

/** Look up one concept's direction (used by the render binding + the card UI). */
export function directionByName(result: ArtDirectionResult, name: string): ArtDirection | undefined {
  return result.directions.find((d) => d.conceptName === name);
}
