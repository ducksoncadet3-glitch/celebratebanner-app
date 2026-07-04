/**
 * Unit tests for the Memory Profile Engine.
 * Runs with Node's built-in test runner (no dependencies):  node --test test/
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateMemoryProfile, SCHEMA_VERSION } from '../src/index.ts';
import { scenarios, graduation } from './scenarios.ts';
import type { MemoryProfile } from '../src/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const loadFixture = (key: string): MemoryProfile =>
  JSON.parse(readFileSync(join(here, '..', 'fixtures', `${key}.json`), 'utf8'));

const REQUIRED_FIELDS = [
  'schema_version', 'occasion', 'style', 'story', 'mood', 'primary_subject',
  'hero_photo', 'supporting_photos', 'photo_rankings', 'family_members', 'groups',
  'dominant_colors', 'photo_quality_scores', 'face_count', 'portrait_count',
  'landscape_count', 'square_count', 'duplicate_candidates', 'restoration_candidates',
  'recommended_concept', 'confidence_score', 'warnings', 'future_extension_fields',
];

const CONCEPTS = ['Signature Edition', 'Luxury Gold', 'Family Legacy', 'Modern Editorial'];

// ── Structural invariants across every scenario ───────────────────────────────
for (const s of scenarios) {
  test(`[${s.key}] produces a complete, well-formed profile`, () => {
    const p = generateMemoryProfile(s.photos, s.options);

    for (const f of REQUIRED_FIELDS) {
      assert.ok(f in p, `missing field: ${f}`);
    }
    assert.equal(p.schema_version, SCHEMA_VERSION);
    assert.equal(p.occasion, s.options.occasion);
    assert.ok(CONCEPTS.includes(p.recommended_concept), 'valid concept');

    // Every uploaded photo appears exactly once in the rankings.
    assert.equal(p.photo_rankings.length, s.photos.length);
    const rankedIds = new Set(p.photo_rankings.map((r) => r.photoId));
    assert.equal(rankedIds.size, s.photos.length);

    // Exactly one hero role in rankings, matching hero_photo.
    const heroRanks = p.photo_rankings.filter((r) => r.role === 'hero');
    assert.equal(heroRanks.length, 1, 'exactly one hero');
    assert.ok(p.hero_photo, 'hero_photo present');
    assert.equal(p.hero_photo!.photoId, heroRanks[0].photoId);

    // Confidence + counts are sane.
    assert.ok(p.confidence_score >= 0 && p.confidence_score <= 100);
    assert.equal(p.portrait_count + p.landscape_count + p.square_count, s.photos.length);

    // Hero is never a suppressed duplicate.
    const suppressed = new Set(
      p.duplicate_candidates.flatMap((d) => d.group).filter((id) => !p.duplicate_candidates.some((d) => d.keep === id)),
    );
    assert.ok(!suppressed.has(p.hero_photo!.photoId), 'hero is not a dropped duplicate');
  });
}

// ── Snapshot: deterministic output matches committed fixtures ──────────────────
for (const s of scenarios) {
  test(`[${s.key}] matches its committed fixture snapshot`, () => {
    const produced = generateMemoryProfile(s.photos, s.options);
    const expected = loadFixture(s.key);
    assert.deepEqual(produced, expected);
  });
}

// ── Determinism ───────────────────────────────────────────────────────────────
test('identical input yields identical output', () => {
  const a = generateMemoryProfile(graduation.photos, graduation.options);
  const b = generateMemoryProfile(graduation.photos, graduation.options);
  assert.deepEqual(a, b);
});

// ── Concept recommendation by occasion ────────────────────────────────────────
test('recommends the expected lead concept per occasion', () => {
  assert.equal(generateMemoryProfile(graduation.photos, { occasion: 'graduation' }).recommended_concept, 'Signature Edition');
  assert.equal(generateMemoryProfile(graduation.photos, { occasion: 'championship' }).recommended_concept, 'Luxury Gold');
  assert.equal(generateMemoryProfile(graduation.photos, { occasion: 'memorial' }).recommended_concept, 'Family Legacy');
  assert.equal(generateMemoryProfile(graduation.photos, { occasion: 'social' }).recommended_concept, 'Modern Editorial');
});

// ── Hero selection prefers the strong portrait ────────────────────────────────
test('[graduation] chooses the crisp portrait as hero, not the blurry shot', () => {
  const p = generateMemoryProfile(graduation.photos, graduation.options);
  assert.equal(p.hero_photo!.photoId, 'g1');
  assert.equal(p.primary_subject.type, 'individual');
});

// ── Duplicate detection curates the burst ─────────────────────────────────────
test('[graduation] detects the cap-toss duplicate and keeps one', () => {
  const p = generateMemoryProfile(graduation.photos, graduation.options);
  assert.equal(p.duplicate_candidates.length, 1);
  const dup = p.duplicate_candidates[0];
  assert.deepEqual([...dup.group].sort(), ['g2', 'g5']);
  const supportingIds = p.supporting_photos.map((x) => x.photoId);
  const dropped = dup.group.find((id) => id !== dup.keep)!;
  assert.ok(!supportingIds.includes(dropped), 'dropped duplicate is not used');
});

// ── Restoration flags old / low-quality photos ────────────────────────────────
test('[memorial] flags the old monochrome photo for restoration', () => {
  const p = generateMemoryProfile(scenarios.find((s) => s.key === 'memorial')!.photos, { occasion: 'memorial' });
  const flagged = new Set(p.restoration_candidates.map((r) => r.photoId));
  assert.ok(flagged.has('m2'), 'old B&W photo flagged');
});

// ── Graceful degradation ──────────────────────────────────────────────────────
test('empty upload returns an honest, complete profile', () => {
  const p = generateMemoryProfile([], {});
  assert.equal(p.hero_photo, null);
  assert.equal(p.confidence_score, 0);
  assert.ok(p.warnings.some((w) => w.code === 'no_photos'));
  for (const f of REQUIRED_FIELDS) assert.ok(f in p);
});

test('missing analysis signals still produce a profile with warnings + lower confidence', () => {
  const p = generateMemoryProfile(
    [
      { id: 'a', width: 4000, height: 3000 },
      { id: 'b', width: 3000, height: 4000 },
    ],
    { occasion: 'graduation' },
  );
  assert.ok(p.hero_photo, 'still picks a hero');
  assert.ok(p.warnings.some((w) => w.code === 'limited_photo_analysis'));
  assert.ok(p.warnings.some((w) => w.code === 'no_color_data'));
  assert.ok(p.confidence_score < 100);
  // Default palette falls back to the brand core.
  assert.ok(p.dominant_colors.some((c) => c.hex.toUpperCase() === '#0C0E14'));
});

test('no occasion + no hints defaults to unknown with a warning', () => {
  const p = generateMemoryProfile([{ id: 'x', width: 4000, height: 5000, faceCount: 1, sharpness: 0.8 }], {});
  assert.equal(p.occasion, 'unknown');
  assert.ok(p.warnings.some((w) => w.code === 'occasion_not_provided'));
});

test('rejects non-array input', () => {
  // @ts-expect-error — intentional misuse
  assert.throws(() => generateMemoryProfile(null), TypeError);
});
