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

/** Callbacks fired by the reveal UI. None touch checkout or pricing. */
export interface ConceptHandlers {
  onLove?: (concept: WowConcept) => void;         // "Love This"
  onDetails?: (concept: WowConcept) => void;      // "See Details"
  onTryAnother?: (concept: WowConcept) => void;   // "Try Another Direction"
}

export interface ConceptCardProps {
  concept: WowConcept;
  index: number;
  isDirectorsChoice: boolean;
  handlers?: ConceptHandlers;
}

export interface RevealGalleryProps {
  presentation: WowPresentation;
  handlers?: ConceptHandlers;
}

export interface PremiumRevealProps {
  presentation: WowPresentation;
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
