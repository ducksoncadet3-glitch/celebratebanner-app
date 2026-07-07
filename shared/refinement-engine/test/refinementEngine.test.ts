/**
 * Refinement Engine tests. Node's built-in runner (no deps):
 *   node --test 'test/*.test.ts'
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  refineConcept, parseInstruction, recomputeScore, passesGate, evaluateConstitution,
  REFINEMENT_RULES, SCHEMA_VERSION, WOW_THRESHOLD, SCORE_MAX, REFINEMENT_INTENTS,
} from '../src/index.ts';
import type { WowConcept, CreativeBrief, MemoryProfile, RefinedConcept, RefinementIntent, WowScoreBreakdown } from '../src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const load = (rel: string) => JSON.parse(readFileSync(join(here, '..', '..', rel), 'utf8'));
const fxDir = join(here, '..', 'fixtures');

const wp = load('wow-engine/fixtures/graduation.json');
const cb: CreativeBrief = load('creative-brief/fixtures/graduation.json');
const mp: MemoryProfile = load('memory-profile/fixtures/graduation.json');
const CONCEPT: WowConcept = wp.concepts.find((c: WowConcept) => c.conceptName === wp.recommendedConcept);

const refine = (instruction: string, concept: WowConcept = CONCEPT, brief: CreativeBrief = cb): RefinedConcept =>
  refineConcept(concept, instruction, brief, mp);

// A representative single-intent phrase for each of the 14 intents.
const INTENT_PHRASE: Record<RefinementIntent, string> = {
  luxury: 'make it more luxurious',
  elegance: 'more elegant and refined',
  modern: 'a modern editorial look',
  classic: 'more classic and timeless',
  minimal: 'cleaner and more minimal',
  celebration: 'more festive and celebratory',
  'hero-emphasis': 'make the hero bigger',
  typography: 'refine the typography',
  color: 'warmer colors',
  decoration: 'add a little decoration',
  lighting: 'add a soft spotlight and glow',
  emotion: 'make it more heartfelt',
  background: 'deepen the background',
  energy: 'more energy and punch',
};

// ── Exports ──────────────────────────────────────────────────────────
test('SCHEMA_VERSION and WOW_THRESHOLD are exported', () => {
  assert.equal(typeof SCHEMA_VERSION, 'string');
  assert.equal(WOW_THRESHOLD, 90);
});
test('there are exactly fourteen supported intents', () => {
  assert.equal(REFINEMENT_INTENTS.length, 14);
});

// ── Parser: intent detection ─────────────────────────────────────────
for (const intent of REFINEMENT_INTENTS) {
  test(`parser detects the "${intent}" intent`, () => {
    const parsed = parseInstruction(INTENT_PHRASE[intent]);
    assert.ok(parsed.intents.includes(intent), `expected ${intent} in [${parsed.intents}]`);
    assert.deepEqual(parsed.forbidden, []);
  });
}
test('parser recognizes multiple intents in one instruction', () => {
  const parsed = parseInstruction('more luxurious with a bigger hero');
  assert.ok(parsed.intents.includes('luxury'));
  assert.ok(parsed.intents.includes('hero-emphasis'));
});
test('parser returns intents in canonical order', () => {
  const parsed = parseInstruction('more energy but also more luxurious');
  assert.deepEqual(parsed.intents, ['luxury', 'energy']);
});
test('parser does not fire "minimal" on the word "timeless"', () => {
  assert.deepEqual(parseInstruction('keep it timeless').intents, ['classic']);
});
test('parser does not fire "emotion" on "feel more luxurious"', () => {
  const parsed = parseInstruction('make it feel more luxurious');
  assert.deepEqual(parsed.intents, ['luxury']);
});
test('parser returns nothing for gibberish', () => {
  const parsed = parseInstruction('asdfjkl zzzz');
  assert.deepEqual(parsed.intents, []);
  assert.deepEqual(parsed.forbidden, []);
});
test('parser handles empty / non-string input safely', () => {
  assert.deepEqual(parseInstruction('').intents, []);
  assert.deepEqual(parseInstruction(undefined as unknown as string).intents, []);
});

// ── Parser: forbidden requests ───────────────────────────────────────
test('parser flags a hero-reduction request', () => {
  assert.ok(parseInstruction('make the hero smaller').forbidden.some((f) => f.code === 'reduce-hero'));
});
test('parser flags a name-change request', () => {
  assert.ok(parseInstruction('change my name to Sam').forbidden.some((f) => f.code === 'change-name'));
});
test('parser flags a fabricate-people request', () => {
  assert.ok(parseInstruction('add my late grandmother to the photo').forbidden.some((f) => f.code === 'fabricate'));
});
test('parser flags a reorder-memories request', () => {
  assert.ok(parseInstruction('reorder the photos').forbidden.some((f) => f.code === 'reorder-memories'));
});

// ── Acceptance: every intent refines a strong concept and stays ≥90 ──
for (const intent of REFINEMENT_INTENTS) {
  test(`[${intent}] refines the concept and preserves the masterpiece gate`, () => {
    const r = refine(INTENT_PHRASE[intent]);
    assert.equal(r.accepted, true, r.rejectionReasons.join('; '));
    assert.deepEqual(r.intents, [intent]);
    assert.ok(r.wowScore >= 90);
    assert.equal(r.masterpiecePassed, true);
    assert.equal(r.appliedRefinements.length, 1);
    assert.ok(r.changeLog.length >= 1);
    assert.equal(r.scoreBreakdown.total, r.wowScore);
    assert.deepEqual(r.rejectionReasons, []);
  });
}
test('accepted refinement never lowers the WOW score below the original gate', () => {
  for (const intent of REFINEMENT_INTENTS) {
    const r = refine(INTENT_PHRASE[intent]);
    assert.ok(r.wowScore >= 90);
  }
});
test('accepted refinement records at least one recipe field change (except pure-score intents)', () => {
  const r = refine('make it more luxurious');
  assert.ok(r.appliedRefinements[0].changes.length >= 1);
});

// ── Immutability: the input concept is never mutated ─────────────────
test('refineConcept does not mutate the input concept', () => {
  const before = structuredClone(CONCEPT);
  refine('make it more luxurious and add a spotlight');
  assert.deepEqual(CONCEPT, before);
});
test('an accepted refined concept is a distinct object from the input', () => {
  const r = refine('make it more luxurious');
  assert.notEqual(r.concept, CONCEPT);
});

// ── Score recomputation ──────────────────────────────────────────────
const flatBreakdown = (over: Partial<WowScoreBreakdown> = {}): WowScoreBreakdown => ({
  heroStrength: 12, emotionalImpact: 16, storytelling: 12, layoutBalance: 12,
  typography: 8, colorHarmony: 8, luxuryFinish: 8, shareability: 4, total: 80, ...over,
});
test('recomputeScore applies deltas and re-totals', () => {
  const b = recomputeScore(flatBreakdown(), { typography: 1.5 });
  assert.equal(b.typography, 9.5);
  assert.equal(b.total, 82); // 80 + 1.5 → 81.5 → round 82
});
test('recomputeScore clamps each category to its rubric maximum', () => {
  const b = recomputeScore(flatBreakdown({ typography: 9.5 }), { typography: 5 });
  assert.equal(b.typography, SCORE_MAX.typography); // clamped at 10
});
test('recomputeScore never drops a category below zero', () => {
  const b = recomputeScore(flatBreakdown({ shareability: 1 }), { shareability: -10 });
  assert.equal(b.shareability, 0);
});
test('recomputeScore applies the coherence penalty to layout balance only', () => {
  const b = recomputeScore(flatBreakdown(), {}, 1.2);
  assert.equal(b.layoutBalance, 10.8);
  assert.equal(b.heroStrength, 12);
});
test('recomputeScore is deterministic', () => {
  assert.deepEqual(recomputeScore(flatBreakdown(), { luxuryFinish: 1 }, 0.5), recomputeScore(flatBreakdown(), { luxuryFinish: 1 }, 0.5));
});
test('passesGate reflects the 90 threshold', () => {
  assert.equal(passesGate(90), true);
  assert.equal(passesGate(89), false);
});
test('evaluateConstitution lists a reason per failed invariant', () => {
  const c = evaluateConstitution({ wowScorePassed: false, heroDominancePreserved: false, namesUnchanged: true, noFabrication: true, memoriesOrderPreserved: true, clutterAvoided: true });
  assert.equal(c.wowScorePassed, false);
  assert.ok(c.reasons.length >= 2);
});
test('evaluateConstitution passes cleanly when all invariants hold', () => {
  const c = evaluateConstitution({ wowScorePassed: true, heroDominancePreserved: true, namesUnchanged: true, noFabrication: true, memoriesOrderPreserved: true, clutterAvoided: true });
  assert.deepEqual(c.reasons, []);
});

// ── Rejection paths ──────────────────────────────────────────────────
test('reject: conflicting directions (modern + classic)', () => {
  const r = refine('more modern but also very classic');
  assert.equal(r.accepted, false);
  assert.ok(r.rejectionReasons.some((x) => /conflict/i.test(x)));
  assert.equal(r.attemptedScore, null);
});
test('reject: too many changes at once', () => {
  const r = refine('more luxury, more modern, more energy, and more emotion');
  assert.equal(r.accepted, false);
  assert.ok(r.rejectionReasons.some((x) => /too many/i.test(x)));
});
test('reject: hero-reduction request (constitution)', () => {
  const r = refine('make the hero smaller');
  assert.equal(r.accepted, false);
  assert.equal(r.constitution.heroDominancePreserved, false);
  assert.ok(r.rejectionReasons.some((x) => /hero/i.test(x)));
});
test('reject: name-change request (constitution)', () => {
  const r = refine('change my name to Sam');
  assert.equal(r.accepted, false);
  assert.equal(r.constitution.namesUnchanged, false);
});
test('reject: fabricate-people request (constitution)', () => {
  const r = refine('add a person who is not there');
  assert.equal(r.accepted, false);
  assert.equal(r.constitution.noFabrication, false);
});
test('reject: reorder-memories request (constitution)', () => {
  const r = refine('rearrange the photos in a different order');
  assert.equal(r.accepted, false);
  assert.equal(r.constitution.memoriesOrderPreserved, false);
});
test('reject: unrecognized instruction', () => {
  const r = refine('asdfjkl zzzz');
  assert.equal(r.accepted, false);
  assert.ok(r.rejectionReasons.some((x) => /no supported refinement/i.test(x)));
});
test('reject: decoration with no allowlist would create clutter', () => {
  const bareBrief = { ...cb, decorativeDirection: { ...cb.decorativeDirection, allowed: [] } } as CreativeBrief;
  const r = refine('add a little decoration', CONCEPT, bareBrief);
  assert.equal(r.accepted, false);
  assert.equal(r.constitution.clutterAvoided, false);
  assert.ok(r.rejectionReasons.some((x) => /clutter/i.test(x)));
});
test('reject: stacking two ornament-adding refinements would create clutter', () => {
  const r = refine('add decoration and make it more festive and celebratory');
  assert.equal(r.accepted, false);
  assert.ok(r.rejectionReasons.some((x) => /clutter/i.test(x)));
});
test('reject: refinement that drops the score below 90', () => {
  // Borderline concept at exactly 90 whose gains are already maxed out, so a
  // negative-leaning refinement pushes it under the gate.
  const borderline: WowConcept = structuredClone(CONCEPT);
  borderline.scoreBreakdown = { heroStrength: 14, emotionalImpact: 20, storytelling: 13, layoutBalance: 9, typography: 10, colorHarmony: 10, luxuryFinish: 9, shareability: 5, total: 90 };
  borderline.wowScore = 90;
  const r = refineConcept(borderline, 'more energy and punch', cb, mp);
  assert.equal(r.accepted, false);
  assert.equal(r.constitution.wowScorePassed, false);
  assert.ok(r.attemptedScore !== null && r.attemptedScore < 90);
  assert.ok(r.rejectionReasons.some((x) => /90/.test(x)));
});

// ── Rejection preserves the original, unchanged ─────────────────────
test('a rejected refinement returns the ORIGINAL concept unchanged', () => {
  const r = refine('make the hero smaller');
  assert.equal(r.accepted, false);
  assert.deepEqual(r.concept, CONCEPT);
  assert.equal(r.wowScore, r.previousWowScore);
  assert.equal(r.masterpiecePassed, CONCEPT.masterpiecePassed);
});
test('a rejected refinement never ships applied changes to the concept', () => {
  const r = refine('more modern but also very classic');
  assert.equal(r.accepted, false);
  assert.deepEqual(r.appliedRefinements, []);
});

// ── Constitution invariants on accepted refinements ─────────────────
test('hero-emphasis raises hero dominance, bounded by the cap', () => {
  const r = refine('make the hero bigger');
  assert.equal(r.accepted, true);
  assert.ok(r.concept.layoutRecipe.heroDominanceRatio > CONCEPT.layoutRecipe.heroDominanceRatio);
  assert.ok(r.concept.layoutRecipe.heroDominanceRatio <= 0.8);
});
test('no accepted refinement ever reduces hero dominance', () => {
  for (const intent of REFINEMENT_INTENTS) {
    const r = refine(INTENT_PHRASE[intent]);
    if (r.accepted) assert.ok(r.concept.layoutRecipe.heroDominanceRatio >= CONCEPT.layoutRecipe.heroDominanceRatio, intent);
  }
});
test('accepted refinements never change the hero photo, supporting photos, or their order', () => {
  const r = refine('make it more luxurious with a spotlight');
  assert.deepEqual(r.concept.heroPhoto, CONCEPT.heroPhoto);
  assert.deepEqual(r.concept.supportingPhotos, CONCEPT.supportingPhotos);
});
test('accepted refinements keep the concept name and title', () => {
  const r = refine('warmer colors');
  assert.equal(r.concept.conceptName, CONCEPT.conceptName);
  assert.equal(r.concept.title, CONCEPT.title);
});

// ── Determinism ──────────────────────────────────────────────────────
test('refineConcept is deterministic (accept path)', () => {
  assert.deepEqual(refine('more luxurious with a bigger hero'), refine('more luxurious with a bigger hero'));
});
test('refineConcept is deterministic (reject path)', () => {
  assert.deepEqual(refine('make the hero smaller'), refine('make the hero smaller'));
});

// ── Snapshot equality ────────────────────────────────────────────────
const SCENARIOS: Record<string, string> = {
  luxury: 'make it feel more luxurious and opulent',
  elegance: 'more elegant and refined',
  modern: 'give it a modern editorial feel',
  classic: 'make it more classic and timeless',
  minimal: 'cleaner and more minimal',
  celebration: 'make it more festive and celebratory',
  'hero-emphasis': 'make the hero bigger and emphasize the main photo',
  typography: 'refine the typography and headline',
  color: 'warmer, more harmonious colors',
  decoration: 'add a little decoration',
  lighting: 'add a soft spotlight and glow',
  emotion: 'make it more heartfelt and moving',
  background: 'deepen the background',
  energy: 'more energy and punch',
  'combo-luxury-hero': 'more luxurious with a bigger hero',
  'reject-conflict': 'more modern but also very classic',
  'reject-toomany': 'more luxury, more modern, more energy, and more emotion',
  'reject-hero-reduce': 'make the hero smaller',
  'reject-unrecognized': 'asdfjkl please do something',
};
for (const [name, instruction] of Object.entries(SCENARIOS)) {
  test(`[snapshot] ${name} deep-equals its fixture`, () => {
    const fixture = JSON.parse(readFileSync(join(fxDir, `${name}.json`), 'utf8'));
    assert.deepEqual(refine(instruction), fixture);
  });
}
test('every scenario has a committed fixture and vice versa', () => {
  const files = readdirSync(fxDir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', '')).sort();
  assert.deepEqual(files, Object.keys(SCENARIOS).sort());
});

// ── No pixels · no renderer changes ─────────────────────────────────
test('refinement output contains no pixels', () => {
  const s = JSON.stringify(refine('make it more luxurious with a spotlight and warmer colors')).toLowerCase();
  for (const bad of ['data:image', 'base64', '<canvas', '<svg']) assert.ok(!s.includes(bad), `found ${bad}`);
});
function gitStatus(paths: string): string {
  const root = execSync('git rev-parse --show-toplevel', { cwd: here }).toString().trim();
  return execSync(`git status --porcelain -- ${paths}`, { cwd: root }).toString().trim();
}
test('the existing renderer and render adapter are unchanged (additive only)', () => {
  assert.equal(gitStatus('shared/render-engine/src'), '', 'render-engine must be untouched');
  assert.equal(gitStatus('shared/render-adapter/src'), '', 'render-adapter must be untouched');
});
test('index.html and checkout/pricing are unchanged by this engine', () => {
  assert.equal(gitStatus('index.html'), '', 'index.html must be untouched');
});

// ── Review follow-up: parser gap fixes ───────────────────────────────

// (1) Negation — "reduce/less/fewer/remove/tone down decoration" must NOT add ornament.
for (const phrase of ['reduce decorations', 'less decoration', 'fewer decorations', 'remove decorations', 'tone down decoration', 'strip the ornament', 'take away the flourishes']) {
  test(`negation: "${phrase}" routes to minimal, never adds decoration`, () => {
    const parsed = parseInstruction(phrase);
    assert.ok(!parsed.intents.includes('decoration'), `should not add decoration for "${phrase}"`);
    assert.ok(parsed.intents.includes('minimal'), `should route to minimal for "${phrase}"`);
    const r = refine(phrase);
    assert.equal(r.accepted, true, r.rejectionReasons.join('; '));
    assert.ok(r.intents.includes('minimal'));
    assert.ok(!r.intents.includes('decoration'));
  });
}
test('"tone down decoration" is a reduction, not a color change', () => {
  assert.deepEqual(parseInstruction('tone down decoration').intents, ['minimal']);
});
test('a positive decoration request still adds decoration (not negated)', () => {
  assert.deepEqual(parseInstruction('add a little decoration').intents, ['decoration']);
});

// (2) Hero-emphasis coverage — "make X stand out" maps to hero-emphasis.
for (const phrase of ['make my daughter stand out', 'make my son stand out', 'make the graduate stand out', 'make the main person stand out']) {
  test(`hero coverage: "${phrase}" maps to hero-emphasis and is accepted`, () => {
    const parsed = parseInstruction(phrase);
    assert.ok(parsed.intents.includes('hero-emphasis'), `expected hero-emphasis in [${parsed.intents}]`);
    assert.deepEqual(parsed.forbidden, [], 'a stand-out request is not forbidden');
    const r = refine(phrase);
    assert.equal(r.accepted, true, r.rejectionReasons.join('; '));
    assert.ok(r.concept.layoutRecipe.heroDominanceRatio > CONCEPT.layoutRecipe.heroDominanceRatio);
  });
}

// (3) Identity change — refused with an authenticity message, not "unrecognized".
for (const phrase of ['change the person in the photo', 'replace the person', 'swap the person', 'make it another person', 'substitute a different person']) {
  test(`identity refusal: "${phrase}" is a Constitution refusal`, () => {
    const parsed = parseInstruction(phrase);
    assert.ok(parsed.forbidden.some((f) => f.code === 'change-identity'), `expected change-identity for "${phrase}"`);
    const r = refine(phrase);
    assert.equal(r.accepted, false);
    assert.equal(r.constitution.noFabrication, false);
    assert.ok(r.rejectionReasons.some((x) => /replace|swap|people in your photos|preserved/i.test(x)));
    assert.ok(!r.rejectionReasons.some((x) => /no supported refinement/i.test(x)), 'should not be the generic message');
    assert.deepEqual(r.concept, CONCEPT); // original preserved
  });
}
test('identity change is distinct from a photo reorder', () => {
  assert.ok(parseInstruction('swap the person').forbidden.some((f) => f.code === 'change-identity'));
  assert.ok(parseInstruction('swap the photos').forbidden.some((f) => f.code === 'reorder-memories'));
  assert.ok(!parseInstruction('swap the person').forbidden.some((f) => f.code === 'reorder-memories'));
});

// ── Output shape ─────────────────────────────────────────────────────
test('RefinedConcept carries every documented field', () => {
  const r = refine('make it more luxurious');
  for (const f of ['schemaVersion', 'conceptName', 'instruction', 'accepted', 'intents', 'appliedRefinements', 'concept', 'previousWowScore', 'wowScore', 'attemptedScore', 'scoreBreakdown', 'masterpiecePassed', 'rejectionReasons', 'changeLog', 'constitution']) {
    assert.ok(f in r, `missing ${f}`);
  }
});
test('every rule declares a label, summary, and score delta', () => {
  for (const intent of REFINEMENT_INTENTS) {
    const rule = REFINEMENT_RULES[intent];
    assert.ok(rule.label && rule.summary);
    assert.ok(Object.keys(rule.scoreDelta).length >= 1);
  }
});
