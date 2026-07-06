/**
 * WOW Engine unit tests. Node's built-in runner (no deps):
 *   node --test 'test/*.test.ts'
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateWOWPresentation, SCHEMA_VERSION, WOW_THRESHOLD, CONCEPT_ORDER } from '../src/index.ts';
import type { MemoryProfile, CreativeBrief, WowPresentation, WowConcept } from '../src/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const mpDir = join(here, '..', '..', 'memory-profile', 'fixtures');
const cbDir = join(here, '..', '..', 'creative-brief', 'fixtures');
const fxDir = join(here, '..', 'fixtures');

const KEYS = ['graduation', 'championship', 'family', 'wedding', 'memorial'] as const;
type Key = (typeof KEYS)[number];

const loadProfile = (k: Key): MemoryProfile => JSON.parse(readFileSync(join(mpDir, `${k}.json`), 'utf8'));
const loadBrief = (k: Key): CreativeBrief => JSON.parse(readFileSync(join(cbDir, `${k}.json`), 'utf8'));
const loadFixture = (k: Key): WowPresentation => JSON.parse(readFileSync(join(fxDir, `${k}.json`), 'utf8'));
const run = (k: Key): WowPresentation => generateWOWPresentation(loadProfile(k), loadBrief(k));

const PRESENTATION_FIELDS = [
  'schemaVersion', 'version', 'createdAt', 'occasion', 'recommendedConcept',
  'masterpiecePassed', 'overallWOWScore', 'concepts',
];
const CONCEPT_FIELDS = [
  'conceptName', 'title', 'subtitle', 'creativeExplanation', 'purchasePsychology',
  'heroPhoto', 'supportingPhotos', 'layoutRecipe', 'colorRecipe', 'typographyRecipe',
  'recommendedProduct', 'sharePreview', 'wowScore', 'masterpiecePassed',
];
const MANIPULATIVE = ['hurry', 'limited time', 'act now', 'don\'t miss', 'while supplies last', 'only 1 left', 'expires', 'last chance'];

// ── Exports & constants ──────────────────────────────────────────────
test('SCHEMA_VERSION is exported', () => assert.equal(typeof SCHEMA_VERSION, 'string'));
test('WOW_THRESHOLD is 90', () => assert.equal(WOW_THRESHOLD, 90));
test('CONCEPT_ORDER lists the four canonical concepts', () =>
  assert.deepEqual([...CONCEPT_ORDER], ['Signature Edition', 'Luxury Gold', 'Family Legacy', 'Modern Editorial']));

// ── Group A — Public API & schema (per key) ──────────────────────────
for (const k of KEYS) {
  test(`[${k}] presentation has every required field`, () => {
    const p = run(k);
    for (const f of PRESENTATION_FIELDS) assert.ok(f in p, `missing ${f}`);
  });
  test(`[${k}] produces exactly four concepts in canonical order`, () => {
    const p = run(k);
    assert.equal(p.concepts.length, 4);
    assert.deepEqual(p.concepts.map((c) => c.conceptName), [...CONCEPT_ORDER]);
  });
}

// ── Group B — Snapshot equality ──────────────────────────────────────
for (const k of KEYS) {
  test(`[${k}] deep-equals its committed snapshot fixture`, () => {
    assert.deepEqual(run(k), loadFixture(k));
  });
}

// ── Group C — Determinism ────────────────────────────────────────────
for (const k of KEYS) {
  test(`[${k}] is deterministic (two runs identical)`, () => {
    assert.deepEqual(run(k), run(k));
  });
}
test('createdAt defaults to null (pure engine)', () => {
  assert.equal(run('graduation').createdAt, null);
});
test('options.now stamps createdAt without changing anything else', () => {
  const profile = loadProfile('graduation');
  const brief = loadBrief('graduation');
  const a = generateWOWPresentation(profile, brief);
  const b = generateWOWPresentation(profile, brief, { now: '2026-05-20T00:00:00.000Z' });
  assert.equal(b.createdAt, '2026-05-20T00:00:00.000Z');
  assert.deepEqual({ ...b, createdAt: null }, a);
});

// ── Group D — Concept structure & score bounds ───────────────────────
for (const k of KEYS) {
  test(`[${k}] every concept has all required fields`, () => {
    for (const c of run(k).concepts) for (const f of CONCEPT_FIELDS) assert.ok(f in c, `${c.conceptName} missing ${f}`);
  });
  test(`[${k}] wowScore matches breakdown.total and is within 0..100`, () => {
    for (const c of run(k).concepts) {
      assert.equal(c.wowScore, c.scoreBreakdown.total);
      assert.ok(c.wowScore >= 0 && c.wowScore <= 100);
    }
  });
  test(`[${k}] each score category stays within its rubric cap`, () => {
    const caps: Record<string, number> = { heroStrength: 15, emotionalImpact: 20, storytelling: 15, layoutBalance: 15, typography: 10, colorHarmony: 10, luxuryFinish: 10, shareability: 5 };
    for (const c of run(k).concepts) {
      for (const [cat, cap] of Object.entries(caps)) {
        const v = (c.scoreBreakdown as unknown as Record<string, number>)[cat];
        assert.ok(v >= 0 && v <= cap, `${c.conceptName} ${cat}=${v} exceeds ${cap}`);
      }
    }
  });
}

// ── Group E — Score aggregation & masterpiece gate (strong inputs) ────
for (const k of KEYS) {
  test(`[${k}] overallWOWScore equals the rounded average of concept scores`, () => {
    const p = run(k);
    const avg = Math.round(p.concepts.reduce((s, c) => s + c.wowScore, 0) / p.concepts.length);
    assert.equal(p.overallWOWScore, avg);
  });
  test(`[${k}] all four concepts clear the 90 gate; presentation passes`, () => {
    const p = run(k);
    for (const c of p.concepts) {
      assert.ok(c.wowScore >= 90, `${c.conceptName} scored ${c.wowScore}`);
      assert.equal(c.masterpiecePassed, true);
      assert.deepEqual(c.failureReasons, []);
    }
    assert.equal(p.masterpiecePassed, true);
  });
}

// ── Group F — Creative explanations (derived, never invented) ─────────
for (const k of KEYS) {
  test(`[${k}] creativeExplanation is derived from the inputs`, () => {
    const profile = loadProfile(k);
    const p = run(k);
    for (const c of p.concepts) {
      assert.ok(c.creativeExplanation.length > 40);
      // references the actual chosen hero filename when one exists (no fabrication)
      if (profile.hero_photo?.filename) {
        assert.ok(c.creativeExplanation.includes(profile.hero_photo.filename), `${c.conceptName} should cite the hero filename`);
      }
    }
  });
}
test('the four explanations are distinct (not copy-pasted)', () => {
  const ex = run('graduation').concepts.map((c) => c.creativeExplanation);
  assert.equal(new Set(ex).size, 4);
});

// ── Group G — Purchase psychology (guides, never manipulates) ─────────
for (const k of KEYS) {
  test(`[${k}] purchasePsychology guides, never manipulates`, () => {
    for (const c of run(k).concepts) {
      assert.ok(c.purchasePsychology.length > 10);
      const lower = c.purchasePsychology.toLowerCase();
      for (const bad of MANIPULATIVE) assert.ok(!lower.includes(bad), `manipulative phrase "${bad}" in ${c.conceptName}`);
      assert.ok(lower.includes(c.recommendedProduct.toLowerCase()), 'should reference the recommended product');
    }
  });
}

// ── Group H — Recipes are complete and sane ──────────────────────────
for (const k of KEYS) {
  test(`[${k}] layout/color/typography recipes are complete`, () => {
    for (const c of run(k).concepts) {
      for (const f of ['arrangement', 'heroPlacement', 'heroDominanceRatio', 'supportingLayout', 'balance', 'whitespace', 'focalPath', 'maxSupporting']) assert.ok(f in c.layoutRecipe);
      assert.ok(c.layoutRecipe.heroDominanceRatio >= 0 && c.layoutRecipe.heroDominanceRatio <= 1);
      for (const f of ['ground', 'accent', 'neutral', 'palette', 'source', 'guidance']) assert.ok(f in c.colorRecipe);
      assert.ok(Array.isArray(c.colorRecipe.palette) && c.colorRecipe.palette.length > 0);
      for (const f of ['style', 'displayFont', 'supportingFont', 'headlineTreatment', 'labelTreatment', 'guidance']) assert.ok(f in c.typographyRecipe);
      assert.equal(c.typographyRecipe.displayFont, 'Cormorant Garamond');
    }
  });
  test(`[${k}] supportingPhotos never exceed the concept's maxSupporting`, () => {
    for (const c of run(k).concepts) assert.ok(c.supportingPhotos.length <= c.layoutRecipe.maxSupporting);
  });
}

// ── Group I — NO PIXELS ───────────────────────────────────────────────
for (const k of KEYS) {
  test(`[${k}] output contains no pixels/markup/images`, () => {
    const s = JSON.stringify(run(k)).toLowerCase();
    for (const banned of ['<canvas', '<svg', '<html', 'data:image', 'base64', '<img']) assert.ok(!s.includes(banned), `found ${banned}`);
  });
}

// ── Group J — The 90 gate rejects weak inputs ─────────────────────────
function weakInputs(): { profile: MemoryProfile; brief: CreativeBrief } {
  const profile = structuredClone(loadProfile('graduation'));
  if (profile.hero_photo) { profile.hero_photo.score = 48; profile.hero_photo.faceCount = 0; }
  profile.primary_subject.faceCount = 0;
  profile.confidence_score = 20;
  profile.supporting_photos = [];
  profile.photo_rankings = profile.photo_rankings.slice(0, 1);
  profile.groups = [];
  const brief = structuredClone(loadBrief('graduation'));
  brief.confidenceScore = 25;
  brief.heroStrategy.dominanceRatio = 0.4;
  brief.emotionalDirection.keywords = ['pride'];
  brief.colorDirection.source = 'occasion-default';
  brief.riskWarnings = [{ code: 'weak_hero', message: 'Hero photo is not strong enough.', severity: 'warning' }];
  return { profile, brief };
}
test('weak input: at least one concept fails with failure reasons', () => {
  const { profile, brief } = weakInputs();
  const p = generateWOWPresentation(profile, brief);
  const failed = p.concepts.filter((c: WowConcept) => !c.masterpiecePassed);
  assert.ok(failed.length >= 1, 'expected at least one failing concept');
  for (const c of failed) assert.ok(c.failureReasons.length > 0, `${c.conceptName} should include reasons`);
});
test('weak input: presentation.masterpiecePassed is false', () => {
  const { profile, brief } = weakInputs();
  assert.equal(generateWOWPresentation(profile, brief).masterpiecePassed, false);
});
test('weak input: overallWOWScore is below the 90 gate', () => {
  const { profile, brief } = weakInputs();
  assert.ok(generateWOWPresentation(profile, brief).overallWOWScore < 90);
});
test('weak input: failure reasons cite the 90 gate', () => {
  const { profile, brief } = weakInputs();
  const failed = generateWOWPresentation(profile, brief).concepts.find((c) => !c.masterpiecePassed)!;
  assert.ok(failed.failureReasons.some((r) => r.includes('90')));
});

// ── Group K — Share preview & occasion tone ──────────────────────────
for (const k of KEYS) {
  test(`[${k}] every concept has non-empty share copy`, () => {
    for (const c of run(k).concepts) {
      assert.ok(c.sharePreview.headline.length > 0);
      assert.ok(c.sharePreview.caption.length > 0);
      assert.ok(c.sharePreview.altText.toLowerCase().includes('celebratebanner'));
    }
  });
}
test('memorial share copy is reverent (not the excited caption)', () => {
  for (const c of run('memorial').concepts) assert.ok(!c.sharePreview.caption.includes('😮'));
});

// ── Group L — recommendedConcept carries through ─────────────────────
for (const k of KEYS) {
  test(`[${k}] recommendedConcept carries through from the brief`, () => {
    assert.equal(run(k).recommendedConcept, loadBrief(k).recommendedConcept);
  });
}
