/**
 * Unit tests for the Creative Brief Engine.
 * Runs with Node's built-in test runner (no dependencies):
 *   node --test 'test/*.test.ts'
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateCreativeBrief, SCHEMA_VERSION } from '../src/index.ts';
import type { CreativeBrief, MemoryProfile } from '../src/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const mpFixtures = join(here, '..', '..', 'memory-profile', 'fixtures');
const cbFixtures = join(here, '..', 'fixtures');

const KEYS = ['graduation', 'championship', 'family', 'wedding', 'memorial'] as const;

const loadProfile = (key: string): MemoryProfile =>
  JSON.parse(readFileSync(join(mpFixtures, `${key}.json`), 'utf8'));
const loadBrief = (key: string): CreativeBrief =>
  JSON.parse(readFileSync(join(cbFixtures, `${key}.json`), 'utf8'));

const REQUIRED_FIELDS = [
  'schemaVersion', 'briefId', 'createdAt', 'occasion', 'recommendedConcept',
  'emotionalDirection', 'storyAngle', 'primaryMessage', 'secondaryMessage',
  'heroStrategy', 'supportingPhotoStrategy', 'colorDirection', 'typographyDirection',
  'compositionDirection', 'decorativeDirection', 'productIntent', 'audienceIntent',
  'personalizationSuggestions', 'upsellOpportunities', 'wowTargets', 'riskWarnings',
  'confidenceScore',
];

const CONCEPTS = ['Signature Edition', 'Luxury Gold', 'Family Legacy', 'Modern Editorial'];

// Expected occasion → concept + emotional keyword mapping.
const EXPECTED = {
  graduation: { concept: 'Signature Edition', emotion: 'pride' },
  championship: { concept: 'Luxury Gold', emotion: 'victory' },
  family: { concept: 'Family Legacy', emotion: 'warmth' }, // family_reunion occasion
  wedding: { concept: 'Signature Edition', emotion: 'romance' },
  memorial: { concept: 'Family Legacy', emotion: 'respect' },
} as const;

// ── Completeness + validity across every scenario ─────────────────────────────
for (const key of KEYS) {
  test(`[${key}] produces a complete, well-formed brief`, () => {
    const profile = loadProfile(key);
    const brief = generateCreativeBrief(profile);

    for (const f of REQUIRED_FIELDS) assert.ok(f in brief, `missing field: ${f}`);
    assert.equal(brief.schemaVersion, SCHEMA_VERSION);
    assert.equal(brief.occasion, profile.occasion);
    assert.ok(CONCEPTS.includes(brief.recommendedConcept));
    assert.ok(brief.briefId.startsWith('brief_'));
    assert.equal(brief.createdAt, null, 'createdAt null without options.now');

    // confidenceScore bounded 0–100.
    assert.ok(brief.confidenceScore >= 0 && brief.confidenceScore <= 100);

    // wowTargets always gate at 90.
    assert.equal(brief.wowTargets.overallTarget, 90);

    // Brand core present in the palette.
    const hexes = brief.colorDirection.palette.map((c) => c.hex.toUpperCase());
    assert.ok(hexes.includes('#0C0E14') && hexes.includes('#C9A84C') && hexes.includes('#FAF8F3'));
  });
}

// ── Snapshot: deterministic output matches committed fixtures ──────────────────
for (const key of KEYS) {
  test(`[${key}] matches its committed fixture snapshot`, () => {
    const produced = generateCreativeBrief(loadProfile(key));
    assert.deepEqual(produced, loadBrief(key));
  });
}

// ── recommendedConcept maps correctly per occasion ────────────────────────────
for (const key of KEYS) {
  test(`[${key}] recommends the expected concept`, () => {
    const brief = generateCreativeBrief(loadProfile(key));
    assert.equal(brief.recommendedConcept, EXPECTED[key].concept);
  });
}

// ── emotionalDirection fits the occasion ──────────────────────────────────────
for (const key of KEYS) {
  test(`[${key}] emotionalDirection fits the occasion`, () => {
    const brief = generateCreativeBrief(loadProfile(key));
    assert.equal(brief.emotionalDirection.primary, EXPECTED[key].emotion);
    assert.ok(brief.emotionalDirection.keywords.length >= 2);
    assert.ok(brief.emotionalDirection.statement.length > 0);
  });
}

// ── heroStrategy references the actual hero_photo ─────────────────────────────
for (const key of KEYS) {
  test(`[${key}] heroStrategy references hero_photo`, () => {
    const profile = loadProfile(key);
    const brief = generateCreativeBrief(profile);
    assert.equal(brief.heroStrategy.heroPhotoId, profile.hero_photo?.photoId ?? null);
    if (profile.hero_photo) {
      assert.ok(brief.heroStrategy.rationale.includes(profile.hero_photo.photoId));
      assert.ok(brief.heroStrategy.dominanceRatio > 0 && brief.heroStrategy.dominanceRatio <= 1);
    }
  });
}

// ── Determinism ───────────────────────────────────────────────────────────────
test('identical input yields identical output', () => {
  const p = loadProfile('graduation');
  assert.deepEqual(generateCreativeBrief(p), generateCreativeBrief(p));
});

// ── No mutation of the input Memory Profile ───────────────────────────────────
test('does not mutate the input MemoryProfile', () => {
  const p = loadProfile('championship');
  const before = structuredClone(p);
  generateCreativeBrief(p);
  assert.deepEqual(p, before);
});

// ── Risk warnings appear when appropriate ─────────────────────────────────────
test('weak hero + too few photos + low confidence raise risk warnings', () => {
  const profile: MemoryProfile = {
    ...loadProfile('graduation'),
    confidence_score: 40,
    photo_rankings: [{ photoId: 'x1', rank: 1, compositeScore: 60, role: 'hero' }],
    supporting_photos: [],
    hero_photo: { photoId: 'x1', filename: 'weak.jpg', orientation: 'landscape', score: 55, faceCount: 0, width: 1200, height: 900 },
    restoration_candidates: [{ photoId: 'x1', reasons: ['low_resolution'] }],
  };
  const brief = generateCreativeBrief(profile);
  const codes = new Set(brief.riskWarnings.map((r) => r.code));
  assert.ok(codes.has('too_few_photos'));
  assert.ok(codes.has('weak_hero'));
  assert.ok(codes.has('low_confidence'));
  assert.ok(codes.has('restoration_needed'));
  assert.ok(brief.confidenceScore < profile.confidence_score, 'confidence penalized');
});

test('clean strong profile has no warning-severity risks', () => {
  const brief = generateCreativeBrief(loadProfile('championship'));
  const serious = brief.riskWarnings.filter((r) => r.severity === 'warning');
  assert.equal(serious.length, 0);
});

// ── Graceful handling of unknown occasion ─────────────────────────────────────
test('unknown occasion produces a valid fallback brief', () => {
  const profile: MemoryProfile = {
    ...loadProfile('graduation'),
    occasion: 'unknown',
    recommended_concept: 'Signature Edition',
  };
  const brief = generateCreativeBrief(profile);
  assert.equal(brief.occasion, 'unknown');
  assert.equal(brief.emotionalDirection.primary, 'celebration');
  assert.ok(CONCEPTS.includes(brief.recommendedConcept));
  assert.ok(brief.storyAngle.length > 0);
  for (const f of REQUIRED_FIELDS) assert.ok(f in brief);
});

// ── options.now stamps createdAt deterministically ────────────────────────────
test('options.now stamps createdAt', () => {
  const p = loadProfile('graduation');
  const brief = generateCreativeBrief(p, { now: '2026-07-05T00:00:00Z' });
  assert.equal(brief.createdAt, '2026-07-05T00:00:00Z');
  // briefId is independent of the timestamp.
  assert.equal(brief.briefId, generateCreativeBrief(p).briefId);
});

// ── Invalid input rejected ────────────────────────────────────────────────────
test('rejects non-object input', () => {
  // @ts-expect-error — intentional misuse
  assert.throws(() => generateCreativeBrief(null), TypeError);
  // @ts-expect-error — intentional misuse
  assert.throws(() => generateCreativeBrief([]), TypeError);
});
