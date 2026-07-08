/**
 * @celebratebanner/art-direction-engine
 *
 * The AI Art Director:
 *   … WOW Engine → **Art Direction Engine** → Render Orchestrator → Renderer
 *
 * Public API:
 *   • directArt(memoryProfile, creativeBrief, wowPresentation, options?) → ArtDirectionResult
 *   • directionByName(result, conceptName) → ArtDirection | undefined
 *
 * Gives each of the four concepts a genuinely distinct visual identity — composition
 * philosophy, visual hierarchy, whitespace strategy, hero emphasis (always 55–70%),
 * supporting rhythm, typography hierarchy, luxury level, emotional intensity, framing
 * style, and storytelling flow — then re-writes the presentation's recipes so the
 * untouched Render Orchestrator carries that direction to the renderer.
 *
 * It DECIDES; the renderer EXECUTES. Deterministic, pixel-free, dependency-free.
 */
export { directArt, directionByName } from './engine.ts';
export { IDENTITIES, heroEmphasisFor, clampHeroDominance } from './philosophy.ts';
export { orderPhotoStory, classifyPhoto, beatsForOccasion, STORY_BEATS, DEFAULT_BEATS } from './story.ts';
export { copyFor, bulletsFor, emotionalSentence } from './copy.ts';
export { SCHEMA_VERSION, HERO_DOMINANCE_FLOOR, HERO_DOMINANCE_CEILING } from './types.ts';

export type {
  WowConcept, WowConceptName, WowPresentation, PhotoSummary, CreativeBrief, MemoryProfile,
  Balance, WhitespaceLevel, FramingStyle, Cadence,
  CompositionPhilosophy, WhitespaceStrategy, HeroEmphasis, SupportingRhythm,
  TypographyHierarchy, ArtPalette, RenderTreatment, ConceptCopy, StoryBeat,
  ArtDirection, ArtDirectionResult, DirectArtOptions,
} from './types.ts';
