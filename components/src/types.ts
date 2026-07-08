/**
 * Premium Reveal UI — shared prop types.
 * Inputs come from @celebratebanner/wow-engine (read-only; the UI renders decisions,
 * it never re-decides). No pricing, no checkout, no renderer types here.
 */
import type {
  WowPresentation,
  WowConcept,
  WowConceptName,
} from '../../shared/wow-engine/src/types.ts';

export type { WowPresentation, WowConcept, WowConceptName };

/** The two customer-facing calls to action. Internal status words never appear. */
export const CTA_PRIMARY = 'Choose This Design';
export const CTA_SECONDARY = 'More Details';

/** Art-directed card copy: a title, ONE emotional sentence, THREE premium bullets. */
export interface ConceptCopy {
  title: string;
  emotionalSentence: string;
  bullets: readonly string[];
}

/** Callbacks fired by the reveal UI. None touch checkout or pricing. */
export interface ConceptHandlers {
  onChoose?: (concept: WowConcept) => void;    // primary CTA — "Choose This Design"
  onDetails?: (concept: WowConcept) => void;   // secondary CTA — "More Details"
}

/** Resolve the Art Director's copy for a concept (undefined → house fallback copy). */
export type CopyResolver = (conceptName: WowConceptName) => ConceptCopy | undefined;

export interface ConceptCardProps {
  concept: WowConcept;
  index: number;
  isDirectorsChoice: boolean;
  /** Art-directed copy for this concept. */
  copy?: ConceptCopy;
  handlers?: ConceptHandlers;
}

export interface RevealGalleryProps {
  presentation: WowPresentation;
  copyFor?: CopyResolver;
  handlers?: ConceptHandlers;
}

export interface PremiumRevealProps {
  presentation: WowPresentation;
  copyFor?: CopyResolver;
  handlers?: ConceptHandlers;
  /** Skip the loading intro (default false → shows the six-stage sequence first). */
  skipLoading?: boolean;
  /** Ms between loading stages when auto-advancing (default 900). */
  loadingIntervalMs?: number;
  /** Called once the reveal is shown. */
  onRevealed?: () => void;
}

export interface LoadingSequenceProps {
  onStageChange?: (index: number, label: string) => void;
  onComplete?: () => void;
  /** Auto-advance through stages using timers (default false — caller/tests drive it). */
  auto?: boolean;
  intervalMs?: number;
}

/** The six customer-facing loading stages (Sprint 4 copy). */
export const LOADING_STAGES = [
  'Understanding your celebration',
  'Finding your strongest memories',
  'Selecting your hero photograph',
  "Building your family's story",
  'Creating premium concepts',
  'Final creative review',
] as const;

export const REVEAL_TITLE = 'Your Masterpieces Are Ready';
export const REVEAL_SUBTITLE =
  'Our AI Creative Director created four unique concepts from your memories.';
