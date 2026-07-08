/**
 * @celebratebanner/premium-reveal — the Premium Reveal UI (CelebrateBanner 2.0, Sprint 4).
 *
 * Framework-agnostic vanilla-DOM components that render a WOWPresentation from
 * @celebratebanner/wow-engine. Additive: no build tools, and no coupling to the
 * renderer, pricing, or checkout. Preview placeholders only (no renderer yet).
 *
 * Governed by: docs/CREATIVE_CONSTITUTION.md · docs/CELEBRATEBANNER_DESIGN_BIBLE.md
 * Spec:        docs/WOW_ENGINE_SPECIFICATION.md
 */

export { createPremiumReveal, mountPremiumReveal } from './PremiumReveal/index.ts';
export { createRevealGallery } from './RevealGallery/index.ts';
export { createConceptCard } from './ConceptCard/index.ts';
export { createDirectorChoice } from './DirectorChoice/index.ts';
export { createMasterpieceBadge } from './MasterpieceBadge/index.ts';
export { createWowScore } from './WOWScore/index.ts';
export { createLoadingSequence } from './LoadingSequence/index.ts';
export { CTA_PRIMARY, CTA_SECONDARY } from './types.ts';
export type { LoadingController } from './LoadingSequence/index.ts';
export { injectStyles, PREMIUM_REVEAL_CSS, STYLE_ELEMENT_ID } from './styles.ts';
export { LOADING_STAGES, REVEAL_TITLE, REVEAL_SUBTITLE } from './types.ts';
export type {
  WowPresentation,
  WowConcept,
  WowConceptName,
  ConceptHandlers,
  ConceptCardProps,
  RevealGalleryProps,
  PremiumRevealProps,
  LoadingSequenceProps,
} from './types.ts';
export { h, clear } from './dom.ts';
