/**
 * Render Orchestrator tests. Node's built-in runner (no deps):
 *   node --test 'test/*.test.ts'
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateRenderPlan, conceptArrangement, SCHEMA_VERSION, WOW_THRESHOLD } from '../src/index.ts';
import type { MemoryProfile, CreativeBrief, WowPresentation, RenderPlan, WowConceptName } from '../src/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const mpDir = join(here, '..', '..', 'memory-profile', 'fixtures');
const cbDir = join(here, '..', '..', 'creative-brief', 'fixtures');
const wpDir = join(here, '..', '..', 'wow-engine', 'fixtures');
const fxDir = join(here, '..', 'fixtures');

const KEYS = ['graduation', 'championship', 'family', 'wedding', 'memorial'] as const;
type Key = (typeof KEYS)[number];
const load = (dir: string, k: Key) => JSON.parse(readFileSync(join(dir, `${k}.json`), 'utf8'));
const mp = (k: Key): MemoryProfile => load(mpDir, k);
const cb = (k: Key): CreativeBrief => load(cbDir, k);
const wp = (k: Key): WowPresentation => load(wpDir, k);
const fixture = (k: Key): RenderPlan => load(fxDir, k);
const run = (k: Key): RenderPlan => generateRenderPlan(mp(k), cb(k), wp(k));

const PLAN_FIELDS = [
  'schemaVersion', 'version', 'createdAt', 'occasion', 'conceptName', 'accepted',
  'heroPhoto', 'supportingPhotos', 'layoutRecipe', 'colorRecipe', 'typographyRecipe',
  'renderInstructions', 'exportTargets', 'qualityChecks',
];
const INSTRUCTION_FIELDS = [
  'arrangement', 'heroPlacement', 'supportingPlacement', 'typographyPlacement',
  'backgroundSelection', 'colorPalette', 'decorativeElements', 'spacing', 'layering',
];
const REQUIRED_TARGETS = ['digital', 'poster_18x24', 'poster_24x36', 'framed_24x36'];

// ── Exports ──────────────────────────────────────────────────────────
test('SCHEMA_VERSION exported', () => assert.equal(typeof SCHEMA_VERSION, 'string'));
test('WOW_THRESHOLD is 90', () => assert.equal(WOW_THRESHOLD, 90));

// ── Per-fixture families ─────────────────────────────────────────────
for (const k of KEYS) {
  test(`[${k}] deep-equals its snapshot fixture`, () => assert.deepEqual(run(k), fixture(k)));
  test(`[${k}] is deterministic`, () => assert.deepEqual(run(k), run(k)));
  test(`[${k}] has every RenderPlan field`, () => {
    const p = run(k);
    for (const f of PLAN_FIELDS) assert.ok(f in p, `missing ${f}`);
  });
  test(`[${k}] is accepted with all checks green and no reasons`, () => {
    const q = run(k).qualityChecks;
    assert.equal(q.passed, true);
    assert.deepEqual(q.reasons, []);
    for (const c of ['heroPhoto', 'supportingPhotos', 'wowScore', 'masterpiecePassed', 'layoutRecipeComplete', 'typographyRecipeComplete', 'exportTargetsDefined']) {
      assert.equal((q as unknown as Record<string, boolean>)[c], true, `${c} should be true`);
    }
    assert.equal(run(k).accepted, true);
  });
  test(`[${k}] plans the presentation's recommended concept`, () => {
    assert.equal(run(k).conceptName, wp(k).recommendedConcept);
  });
  test(`[${k}] defines exactly the four export targets`, () => {
    const ids = run(k).exportTargets.map((t) => t.id);
    assert.equal(ids.length, 4);
    assert.deepEqual([...ids].sort(), [...REQUIRED_TARGETS].sort());
  });
  test(`[${k}] renderInstructions is complete`, () => {
    const ri = run(k).renderInstructions;
    for (const f of INSTRUCTION_FIELDS) assert.ok(f in ri, `missing ${f}`);
    assert.ok(ri.heroPlacement.protectFace === true);
    assert.ok(ri.heroPlacement.dominanceRatio > 0 && ri.heroPlacement.dominanceRatio <= 1);
  });
  test(`[${k}] layering is bottom→top with hero above supporting and text on top`, () => {
    const order = run(k).renderInstructions.layering.order;
    assert.ok(order.indexOf('supporting-photos') < order.indexOf('hero-photo'));
    assert.ok(order.indexOf('hero-photo') < order.indexOf('title-text'));
    assert.equal(order[0], 'background');
  });
  test(`[${k}] produces NO pixels`, () => {
    const s = JSON.stringify(run(k)).toLowerCase();
    for (const bad of ['data:image', 'base64', '<canvas', '<svg', 'dataurl']) assert.ok(!s.includes(bad), `found ${bad}`);
  });
  test(`[${k}] carries hero + supporting photos from the WOW concept`, () => {
    const p = run(k);
    const concept = wp(k).concepts.find((c) => c.conceptName === p.conceptName)!;
    assert.deepEqual(p.heroPhoto, concept.heroPhoto);
    assert.deepEqual(p.supportingPhotos, concept.supportingPhotos);
    assert.ok(p.supportingPhotos.length >= 1);
  });
}

// ── Options ──────────────────────────────────────────────────────────
test('options.conceptName selects a specific concept (and its arrangement)', () => {
  const p = generateRenderPlan(mp('graduation'), cb('graduation'), wp('graduation'), { conceptName: 'Modern Editorial' });
  assert.equal(p.conceptName, 'Modern Editorial');
  assert.equal(p.renderInstructions.arrangement, 'magazine');
  assert.equal(p.accepted, true);
});
test('createdAt is null by default and stamped from options.now', () => {
  assert.equal(run('graduation').createdAt, null);
  const stamped = generateRenderPlan(mp('graduation'), cb('graduation'), wp('graduation'), { now: '2026-06-01T00:00:00.000Z' });
  assert.equal(stamped.createdAt, '2026-06-01T00:00:00.000Z');
  assert.deepEqual({ ...stamped, createdAt: null }, run('graduation'));
});

// ── Export target specs ──────────────────────────────────────────────
test('export target dimensions are 300 DPI with bleed + safe margin', () => {
  const t = run('graduation').exportTargets;
  const by = (id: string) => t.find((x) => x.id === id)!;
  assert.deepEqual([by('poster_24x36').widthPx, by('poster_24x36').heightPx], [7200, 10800]);
  assert.deepEqual([by('poster_18x24').widthPx, by('poster_18x24').heightPx], [5400, 7200]);
  for (const x of t) { assert.equal(x.dpi, 300); assert.equal(x.bleedIn, 0.125); assert.equal(x.safeMarginIn, 0.25); }
});
test('digital target is RGB; poster/framed targets are CMYK', () => {
  const t = run('graduation').exportTargets;
  assert.equal(t.find((x) => x.id === 'digital')!.colorMode, 'RGB');
  for (const id of ['poster_18x24', 'poster_24x36', 'framed_24x36']) {
    assert.equal(t.find((x) => x.id === id)!.colorMode, 'CMYK');
  }
});
test('framed edition is framed + matte; posters are not', () => {
  const t = run('graduation').exportTargets;
  const framed = t.find((x) => x.id === 'framed_24x36')!;
  assert.equal(framed.framed, true);
  assert.equal(framed.matte, true);
  assert.equal(t.find((x) => x.id === 'poster_24x36')!.framed, false);
});
test('every export target carries jpg + pdf formats', () => {
  for (const x of run('graduation').exportTargets) {
    assert.ok(x.formats.includes('jpg') && x.formats.includes('pdf'));
  }
});

// ── Translation fidelity (no invention) ──────────────────────────────
test('decorativeElements come from the brief allowlist (nothing invented)', () => {
  const p = run('graduation');
  const allowed = cb('graduation').decorativeDirection.allowed;
  for (const d of p.renderInstructions.decorativeElements) assert.ok(allowed.includes(d), `${d} not in brief`);
});
test('colorPalette is carried from the concept color recipe', () => {
  const p = run('graduation');
  const concept = wp('graduation').concepts.find((c) => c.conceptName === p.conceptName)!;
  assert.equal(p.renderInstructions.colorPalette.ground, concept.colorRecipe.ground);
  assert.equal(p.renderInstructions.colorPalette.accent, concept.colorRecipe.accent);
  assert.equal(p.renderInstructions.colorPalette.neutral, concept.colorRecipe.neutral);
});
test('hero dominance ratio is carried from the concept layout recipe', () => {
  const p = run('graduation');
  const concept = wp('graduation').concepts.find((c) => c.conceptName === p.conceptName)!;
  assert.equal(p.renderInstructions.heroPlacement.dominanceRatio, concept.layoutRecipe.heroDominanceRatio);
});
test('concept → arrangement mapping is correct for all four concepts', () => {
  assert.equal(conceptArrangement('Signature Edition'), 'classic');
  assert.equal(conceptArrangement('Luxury Gold'), 'pyramid');
  assert.equal(conceptArrangement('Family Legacy'), 'mosaic');
  assert.equal(conceptArrangement('Modern Editorial'), 'magazine');
});
test('Luxury Gold gets a spotlight; Signature Edition does not', () => {
  const lux = generateRenderPlan(mp('championship'), cb('championship'), wp('championship'), { conceptName: 'Luxury Gold' });
  const sig = generateRenderPlan(mp('championship'), cb('championship'), wp('championship'), { conceptName: 'Signature Edition' });
  assert.equal(lux.renderInstructions.heroPlacement.spotlight, true);
  assert.equal(sig.renderInstructions.heroPlacement.spotlight, false);
});
test('magazine concept aligns typography left; centered concepts center it', () => {
  const mag = generateRenderPlan(mp('graduation'), cb('graduation'), wp('graduation'), { conceptName: 'Modern Editorial' });
  const ctr = generateRenderPlan(mp('graduation'), cb('graduation'), wp('graduation'), { conceptName: 'Signature Edition' });
  assert.equal(mag.renderInstructions.typographyPlacement.alignment, 'left');
  assert.equal(ctr.renderInstructions.typographyPlacement.alignment, 'center');
});

// ── Validation failures (rejection with reasons) ─────────────────────
function weaken(k: Key, mutate: (wp: WowPresentation, targetConcept: string) => void): RenderPlan {
  const p = structuredClone(wp(k));
  mutate(p, p.recommendedConcept);
  return generateRenderPlan(mp(k), cb(k), p);
}
const rec = (p: WowPresentation) => p.concepts.find((c) => c.conceptName === p.recommendedConcept)!;

test('reject: missing hero photo', () => {
  const p = weaken('graduation', (w) => { rec(w).heroPhoto = null; });
  assert.equal(p.accepted, false);
  assert.equal(p.qualityChecks.heroPhoto, false);
  assert.ok(p.qualityChecks.reasons.some((r) => /hero/i.test(r)));
});
test('reject: no supporting photos', () => {
  const p = weaken('graduation', (w) => { rec(w).supportingPhotos = []; });
  assert.equal(p.accepted, false);
  assert.equal(p.qualityChecks.supportingPhotos, false);
  assert.ok(p.qualityChecks.reasons.some((r) => /supporting/i.test(r)));
});
test('reject: WOW score below 90', () => {
  const p = weaken('graduation', (w) => { rec(w).wowScore = 84; });
  assert.equal(p.accepted, false);
  assert.equal(p.qualityChecks.wowScore, false);
  assert.ok(p.qualityChecks.reasons.some((r) => r.includes('90')));
});
test('reject: masterpiece gate not passed', () => {
  const p = weaken('graduation', (w) => { rec(w).masterpiecePassed = false; });
  assert.equal(p.accepted, false);
  assert.equal(p.qualityChecks.masterpiecePassed, false);
});
test('reject: incomplete layout recipe', () => {
  const p = weaken('graduation', (w) => { (rec(w).layoutRecipe as { heroDominanceRatio: number }).heroDominanceRatio = 0; });
  assert.equal(p.accepted, false);
  assert.equal(p.qualityChecks.layoutRecipeComplete, false);
});
test('reject: incomplete typography recipe', () => {
  const p = weaken('graduation', (w) => { (rec(w).typographyRecipe as { displayFont: string }).displayFont = ''; });
  assert.equal(p.accepted, false);
  assert.equal(p.qualityChecks.typographyRecipeComplete, false);
});
test('reject: unknown concept name (not found in presentation)', () => {
  const p = generateRenderPlan(mp('graduation'), cb('graduation'), wp('graduation'), { conceptName: 'Nope' as WowConceptName });
  assert.equal(p.accepted, false);
  assert.equal(p.heroPhoto, null);
  assert.ok(p.qualityChecks.reasons.some((r) => /not found/i.test(r)));
});
test('rejected plan still returns a safe shape with four export targets', () => {
  const p = weaken('graduation', (w) => { rec(w).heroPhoto = null; });
  assert.equal(p.exportTargets.length, 4);
  assert.equal(p.qualityChecks.exportTargetsDefined, true); // targets are still valid even when the concept is not
  for (const f of PLAN_FIELDS) assert.ok(f in p);
});
test('multiple failures accumulate multiple reasons', () => {
  const p = weaken('graduation', (w) => { rec(w).heroPhoto = null; rec(w).supportingPhotos = []; rec(w).wowScore = 10; });
  assert.ok(p.qualityChecks.reasons.length >= 3);
});
