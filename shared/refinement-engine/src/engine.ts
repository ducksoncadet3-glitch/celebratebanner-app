/**
 * The refinement engine — public entry point.
 *
 *   refineConcept(selectedConcept, customerInstruction, creativeBrief, memoryProfile, options?)
 *     → RefinedConcept
 *
 * Parses the instruction into intents, refuses forbidden requests, applies bounded
 * recipe edits, recomputes the WOW Score, and re-gates at 90. Never invents facts,
 * fabricates people, changes names, reorders memories, reduces hero dominance, or
 * ships clutter or a sub-90 result. Deterministic; produces no pixels.
 */
import type {
  WowConcept, CreativeBrief, MemoryProfile, RefinedConcept, RefineOptions,
  RefinementIntent, AppliedRefinement, ScoreCategory, FieldChange,
} from './types.ts';
import { SCHEMA_VERSION } from './types.ts';
import { parseInstruction } from './parser.ts';
import { REFINEMENT_RULES } from './rules.ts';
import { recomputeScore, passesGate, evaluateConstitution } from './validator.ts';

const round2 = (n: number): number => Math.round(n * 100) / 100;
const clone = <T>(v: T): T => structuredClone(v);

function detectConflicts(intents: RefinementIntent[]): string[] {
  const set = new Set(intents);
  const reasons: string[] = [];
  const seen = new Set<string>();
  for (const a of intents) {
    for (const b of REFINEMENT_RULES[a].conflictsWith) {
      if (set.has(b)) {
        const key = [a, b].sort().join('+');
        if (!seen.has(key)) {
          seen.add(key);
          reasons.push(`Conflicting directions: “${REFINEMENT_RULES[a].label}” and “${REFINEMENT_RULES[b].label}” pull against each other — pick one.`);
        }
      }
    }
  }
  return reasons;
}

export function refineConcept(
  selectedConcept: WowConcept,
  customerInstruction: string,
  creativeBrief: CreativeBrief,
  memoryProfile: MemoryProfile,
  options: RefineOptions = {},
): RefinedConcept {
  const maxIntents = options.maxIntents ?? 3;
  const maxHeroDominance = options.maxHeroDominance ?? 0.8;
  const previousWowScore = selectedConcept.wowScore;

  const { intents, forbidden } = parseInstruction(customerInstruction);

  // Shared shell for a rejection (returns the ORIGINAL concept, untouched).
  const reject = (reasons: string[], flags: Partial<Parameters<typeof evaluateConstitution>[0]> = {}, attemptedScore: number | null = null, applied: AppliedRefinement[] = [], changeLog: string[] = []): RefinedConcept => {
    const constitution = evaluateConstitution({
      wowScorePassed: flags.wowScorePassed ?? true,
      heroDominancePreserved: flags.heroDominancePreserved ?? true,
      namesUnchanged: flags.namesUnchanged ?? true,
      noFabrication: flags.noFabrication ?? true,
      memoriesOrderPreserved: flags.memoriesOrderPreserved ?? true,
      clutterAvoided: flags.clutterAvoided ?? true,
    });
    const original = clone(selectedConcept);
    return {
      schemaVersion: SCHEMA_VERSION,
      conceptName: selectedConcept.conceptName,
      instruction: customerInstruction,
      accepted: false,
      intents,
      appliedRefinements: applied,
      concept: original,
      previousWowScore,
      wowScore: previousWowScore,
      attemptedScore,
      scoreBreakdown: original.scoreBreakdown,
      masterpiecePassed: original.masterpiecePassed,
      rejectionReasons: reasons,
      changeLog,
      constitution,
    };
  };

  // ── Pre-apply guards (nothing is changed) ────────────────────────────
  if (forbidden.length) {
    const flags = {
      heroDominancePreserved: !forbidden.some((f) => f.code === 'reduce-hero'),
      namesUnchanged: !forbidden.some((f) => f.code === 'change-name'),
      noFabrication: !forbidden.some((f) => f.code === 'fabricate'),
      memoriesOrderPreserved: !forbidden.some((f) => f.code === 'reorder-memories'),
    };
    return reject(forbidden.map((f) => f.reason), flags);
  }
  if (intents.length === 0) {
    return reject(['No supported refinement was recognized in the request. Try “more luxurious”, “bigger hero”, or “warmer colors”.']);
  }
  if (intents.length > maxIntents) {
    return reject([`Too many changes at once (${intents.length}). Refine one to ${maxIntents} aspects at a time to protect coherence.`]);
  }
  const conflicts = detectConflicts(intents);
  if (conflicts.length) {
    return reject(conflicts);
  }
  // Clutter guard: ornament requests must stay restrained.
  const ornamentCount = intents.filter((i) => REFINEMENT_RULES[i].ornament).length;
  const decorationWithoutAllowlist = intents.includes('decoration')
    && !(Array.isArray(creativeBrief.decorativeDirection?.allowed) && creativeBrief.decorativeDirection.allowed.length > 0);
  if (ornamentCount >= 2 || decorationWithoutAllowlist) {
    return reject(
      [decorationWithoutAllowlist
        ? 'No tasteful decoration is available for this occasion — adding ornament would create clutter.'
        : 'Stacking multiple ornament-adding refinements would create clutter — keep it restrained.'],
      { clutterAvoided: false },
    );
  }

  // ── Apply refinements to a clone ─────────────────────────────────────
  const refined = clone(selectedConcept);
  const applied: AppliedRefinement[] = [];
  const totalDeltas: Partial<Record<ScoreCategory, number>> = {};
  const changeLog: string[] = [];

  const originalDom = selectedConcept.layoutRecipe.heroDominanceRatio;

  for (const intent of intents) {
    const rule = REFINEMENT_RULES[intent];
    const changes: FieldChange[] = rule.apply(refined, creativeBrief);

    // hero-emphasis raises hero dominance (bounded); never reduces it.
    if (intent === 'hero-emphasis') {
      const from = refined.layoutRecipe.heroDominanceRatio;
      const to = Math.min(maxHeroDominance, round2(from + 0.06));
      if (to > from) {
        refined.layoutRecipe.heroDominanceRatio = to;
        changes.push({ field: 'layoutRecipe.heroDominanceRatio', from: String(from), to: String(to) });
      }
    }

    for (const [cat, d] of Object.entries(rule.scoreDelta) as [ScoreCategory, number][]) {
      totalDeltas[cat] = round2((totalDeltas[cat] ?? 0) + d);
    }
    applied.push({ intent, label: rule.label, summary: rule.summary, scoreDelta: rule.scoreDelta, changes });
    changeLog.push(`${rule.label} — ${rule.summary}`);
  }

  // Coherence cost of combining changes (models incoherence risk when stacking).
  const coherencePenalty = round2(Math.max(0, intents.length - 1) * 0.6);
  const breakdown = recomputeScore(selectedConcept.scoreBreakdown, totalDeltas, coherencePenalty);
  const wowScorePassed = passesGate(breakdown.total);

  const heroDominancePreserved = refined.layoutRecipe.heroDominanceRatio >= originalDom;
  const constitution = evaluateConstitution({
    wowScorePassed,
    heroDominancePreserved,
    namesUnchanged: true,        // the engine never edits names/photos
    noFabrication: true,
    memoriesOrderPreserved: true,
    clutterAvoided: true,
  });

  // ── Score gate (never ship a sub-90 or constitution-violating result) ─
  if (!constitution.wowScorePassed || !constitution.heroDominancePreserved) {
    changeLog.push(`Attempted WOW Score ${breakdown.total} did not clear the gate; original concept kept.`);
    return reject(constitution.reasons, { wowScorePassed, heroDominancePreserved }, breakdown.total, applied, changeLog);
  }

  // Accepted — bake the new score into the refined concept.
  refined.wowScore = breakdown.total;
  refined.scoreBreakdown = breakdown;
  refined.masterpiecePassed = true;
  refined.failureReasons = [];
  changeLog.push(`WOW Score ${previousWowScore} → ${breakdown.total} (masterpiece preserved).`);

  return {
    schemaVersion: SCHEMA_VERSION,
    conceptName: refined.conceptName,
    instruction: customerInstruction,
    accepted: true,
    intents,
    appliedRefinements: applied,
    concept: refined,
    previousWowScore,
    wowScore: breakdown.total,
    attemptedScore: breakdown.total,
    scoreBreakdown: breakdown,
    masterpiecePassed: true,
    rejectionReasons: [],
    changeLog,
    constitution,
  };
}
