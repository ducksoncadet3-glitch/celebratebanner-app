/**
 * Validator — recomputes the WOW Score after a refinement and runs the Creative
 * Constitution gate. Deterministic. A refinement is accepted only when the recomputed
 * score clears 90 AND every constitutional invariant holds.
 */
import type { WowScoreBreakdown, ScoreCategory, ConstitutionChecks } from './types.ts';
import { SCORE_MAX, WOW_THRESHOLD } from './types.ts';

const clamp = (n: number, lo: number, hi: number): number => (n < lo ? lo : n > hi ? hi : n);
const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Apply per-category deltas (plus a coherence penalty on layout balance) to a score
 * breakdown, clamping each category to its rubric maximum and re-totaling.
 */
export function recomputeScore(
  base: WowScoreBreakdown,
  deltas: Partial<Record<ScoreCategory, number>>,
  coherencePenalty = 0,
): WowScoreBreakdown {
  const cats = Object.keys(SCORE_MAX) as ScoreCategory[];
  const out = {} as WowScoreBreakdown;
  let total = 0;
  for (const c of cats) {
    const penalty = c === 'layoutBalance' ? coherencePenalty : 0;
    const v = clamp(round1(base[c] + (deltas[c] ?? 0) - penalty), 0, SCORE_MAX[c]);
    out[c] = v;
    total += v;
  }
  out.total = Math.round(total);
  return out;
}

export function passesGate(total: number): boolean {
  return total >= WOW_THRESHOLD;
}

export interface ConstitutionFlags {
  wowScorePassed: boolean;
  heroDominancePreserved: boolean;
  namesUnchanged: boolean;
  noFabrication: boolean;
  memoriesOrderPreserved: boolean;
  clutterAvoided: boolean;
}

/** Assemble the constitution result with a human-readable reason per failed check. */
export function evaluateConstitution(flags: ConstitutionFlags, extraReasons: string[] = []): ConstitutionChecks {
  const reasons: string[] = [...extraReasons];
  if (!flags.wowScorePassed) reasons.push(`Refined WOW Score is below the ${WOW_THRESHOLD} gate.`);
  if (!flags.heroDominancePreserved) reasons.push('Refinement would reduce hero dominance — the hero must remain the anchor.');
  if (!flags.namesUnchanged) reasons.push('Refinement would alter a customer name — names are preserved exactly.');
  if (!flags.noFabrication) reasons.push('Refinement would invent facts or fabricate people — only real memories are used.');
  if (!flags.memoriesOrderPreserved) reasons.push('Refinement would reorder memories without justification.');
  if (!flags.clutterAvoided) reasons.push('Refinement would introduce clutter — restraint is required.');

  return {
    wowScorePassed: flags.wowScorePassed,
    heroDominancePreserved: flags.heroDominancePreserved,
    namesUnchanged: flags.namesUnchanged,
    noFabrication: flags.noFabrication,
    memoriesOrderPreserved: flags.memoriesOrderPreserved,
    clutterAvoided: flags.clutterAvoided,
    reasons,
  };
}
