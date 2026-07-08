/**
 * Art Direction Engine tests. Node's built-in runner:
 *   node --test 'test/*.test.ts'
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  directArt, directionByName, IDENTITIES, clampHeroDominance, heroEmphasisFor,
  orderPhotoStory, classifyPhoto, beatsForOccasion, STORY_BEATS, DEFAULT_BEATS,
  copyFor, bulletsFor, emotionalSentence,
  SCHEMA_VERSION, HERO_DOMINANCE_FLOOR, HERO_DOMINANCE_CEILING,
} from '../src/index.ts';
import type { WowConceptName, PhotoSummary, ArtDirection } from '../src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const L = (p: string) => JSON.parse(readFileSync(join(here, '..', '..', p), 'utf8'));
const KEYS = ['graduation', 'championship', 'family', 'wedding', 'memorial'] as const;
const load = (k: string) => ({
  mp: L(`memory-profile/fixtures/${k}.json`),
  cb: L(`creative-brief/fixtures/${k}.json`),
  wp: L(`wow-engine/fixtures/${k}.json`),
});
const run = (k: string) => { const { mp, cb, wp } = load(k); return directArt(mp, cb, wp); };
const CONCEPTS: WowConceptName[] = ['Signature Edition', 'Luxury Gold', 'Family Legacy', 'Modern Editorial'];

const photo = (id: string, filename: string, faceCount = 1): PhotoSummary =>
  ({ photoId: id, filename, orientation: 'portrait', score: 70, faceCount, width: 3000, height: 4000 } as PhotoSummary);

// ── Exports ──────────────────────────────────────────────────────────
test('SCHEMA_VERSION exported', () => assert.equal(typeof SCHEMA_VERSION, 'string'));
test('the hero dominance band is 55–70%', () => {
  assert.equal(HERO_DOMINANCE_FLOOR, 0.55);
  assert.equal(HERO_DOMINANCE_CEILING, 0.70);
});
test('there are exactly four identities', () => assert.equal(Object.keys(IDENTITIES).length, 4));

// ── Engine output shape, per fixture ─────────────────────────────────
for (const k of KEYS) {
  test(`[${k}] directArt returns a direction for each of the four concepts`, () => {
    const r = run(k);
    assert.equal(r.directions.length, 4);
    assert.deepEqual(r.directions.map((d) => d.conceptName).sort(), [...CONCEPTS].sort());
  });
  test(`[${k}] every direction carries the full art-direction brief`, () => {
    for (const d of run(k).directions as unknown as Record<string, unknown>[]) {
      for (const f of ['philosophy', 'whitespace', 'hero', 'supporting', 'typography', 'palette', 'luxuryLevel', 'emotionalIntensity', 'framingStyle', 'storytellingFlow', 'treatment', 'copy']) {
        assert.ok(f in d, `missing ${f}`);
      }
    }
  });
  test(`[${k}] directArt is deterministic`, () => assert.deepEqual(run(k), run(k)));
  test(`[${k}] the art-directed presentation keeps all four concepts and their scores`, () => {
    const { wp } = load(k);
    const r = run(k);
    assert.equal(r.presentation.concepts.length, wp.concepts.length);
    for (let i = 0; i < wp.concepts.length; i++) {
      assert.equal(r.presentation.concepts[i].wowScore, wp.concepts[i].wowScore, 'the art director never re-scores');
      assert.equal(r.presentation.concepts[i].masterpiecePassed, wp.concepts[i].masterpiecePassed);
      assert.deepEqual(r.presentation.concepts[i].heroPhoto, wp.concepts[i].heroPhoto, 'hero photo untouched');
    }
  });
  test(`[${k}] no supporting photo is ever dropped or invented`, () => {
    const { wp } = load(k);
    const r = run(k);
    for (let i = 0; i < wp.concepts.length; i++) {
      const before = wp.concepts[i].supportingPhotos.map((p: PhotoSummary) => p.photoId).sort();
      const after = r.presentation.concepts[i].supportingPhotos.map((p: PhotoSummary) => p.photoId).sort();
      assert.deepEqual(after, before);
    }
  });
  test(`[${k}] directArt produces no pixels`, () => {
    const s = JSON.stringify(run(k)).toLowerCase();
    for (const bad of ['data:image', 'base64', '<canvas', '<svg']) assert.ok(!s.includes(bad));
  });
}

// ── Hero dominance (55–70%, never a dead frame) ──────────────────────
test('every concept places the hero between 55% and 70% of the frame', () => {
  for (const k of KEYS) for (const d of run(k).directions) {
    assert.ok(d.hero.dominanceRatio >= 0.55, `${d.conceptName} ${d.hero.dominanceRatio}`);
    assert.ok(d.hero.dominanceRatio <= 0.70, `${d.conceptName} ${d.hero.dominanceRatio}`);
  }
});
test('the art-directed layout recipe carries the same hero dominance', () => {
  const r = run('graduation');
  for (const c of r.presentation.concepts) {
    const d = directionByName(r, c.conceptName)!;
    assert.equal(c.layoutRecipe.heroDominanceRatio, d.hero.dominanceRatio);
    assert.ok(c.layoutRecipe.heroDominanceRatio >= 0.55 && c.layoutRecipe.heroDominanceRatio <= 0.70);
  }
});
test('dead space is forbidden — the hero always fills its frame', () => {
  for (const d of run('graduation').directions) assert.equal(d.hero.fillsFrame, true);
});
test('clampHeroDominance holds the band and survives junk', () => {
  assert.equal(clampHeroDominance(0.2), 0.55);
  assert.equal(clampHeroDominance(0.99), 0.70);
  assert.equal(clampHeroDominance(0.62), 0.62);
  assert.equal(clampHeroDominance(NaN), 0.55);
});
test('a strong brief nudges hero dominance but never out of band', () => {
  for (const n of CONCEPTS) {
    assert.ok(heroEmphasisFor(n, 5).dominanceRatio <= 0.70);
    assert.ok(heroEmphasisFor(n, -5).dominanceRatio >= 0.55);
  }
});

// ── Concept uniqueness — four identities, not four templates ─────────
const uniq = <T>(xs: T[]) => new Set(xs.map((x) => JSON.stringify(x))).size;
test('all four concepts have a distinct composition philosophy', () => {
  const d = run('graduation').directions;
  assert.equal(uniq(d.map((x) => x.philosophy.thesis)), 4);
  assert.equal(uniq(d.map((x) => x.philosophy.balance)), 4);
  assert.equal(uniq(d.map((x) => x.philosophy.visualHierarchy)), 4);
});
test('all four concepts have a distinct palette', () => {
  const d = run('graduation').directions;
  assert.equal(uniq(d.map((x) => [x.palette.ground, x.palette.accent, x.palette.neutral])), 4);
});
test('all four concepts have a distinct hero treatment (frame + framing style)', () => {
  const d = run('graduation').directions;
  assert.equal(uniq(d.map((x) => [x.hero.frame, x.framingStyle])), 4);
});
test('all four concepts have a distinct whitespace strategy', () => {
  const d = run('graduation').directions;
  assert.equal(uniq(d.map((x) => x.whitespace.level)), 4);
});
test('all four concepts have a distinct render treatment (grade + vignette)', () => {
  const d = run('graduation').directions;
  assert.equal(uniq(d.map((x) => [x.treatment.grade, x.treatment.vignette])), 4);
});
test('all four concepts have distinct luxury and emotional levels', () => {
  const d = run('graduation').directions;
  assert.equal(uniq(d.map((x) => x.luxuryLevel)), 4);
  assert.equal(uniq(d.map((x) => x.emotionalIntensity)), 4);
});
test('all four concepts have a distinct hero dominance', () => {
  assert.equal(uniq(run('graduation').directions.map((x) => x.hero.dominanceRatio)), 4);
});
test('the identities differ in supporting rhythm cadence', () => {
  assert.equal(uniq(Object.values(IDENTITIES).map((i) => i.supporting.cadence)), 4);
});
test('the art-directed presentation gives each concept a distinct colorRecipe', () => {
  const c = run('graduation').presentation.concepts;
  assert.equal(uniq(c.map((x) => [x.colorRecipe.ground, x.colorRecipe.accent])), 4);
});

// ── Identity fidelity to the brief ───────────────────────────────────
test('Signature Edition is symmetrical, museum-framed and restrained', () => {
  const d = directionByName(run('graduation'), 'Signature Edition')!;
  assert.equal(d.philosophy.balance, 'symmetrical');
  assert.equal(d.framingStyle, 'museum');
  assert.equal(d.hero.spotlight, false);
});
test('Luxury Gold is editorial, spotlit, highest luxury and highest contrast', () => {
  const ds = run('graduation').directions;
  const d = directionByName(run('graduation'), 'Luxury Gold')!;
  assert.equal(d.hero.spotlight, true);
  assert.equal(d.luxuryLevel, Math.max(...ds.map((x) => x.luxuryLevel)));
  assert.equal(d.treatment.grade.contrast, Math.max(...ds.map((x) => x.treatment.grade.contrast)));
});
test('Family Legacy is layered, intimate and the most emotional', () => {
  const ds = run('graduation').directions;
  const d = directionByName(run('graduation'), 'Family Legacy')!;
  assert.equal(d.philosophy.balance, 'layered');
  assert.equal(d.framingStyle, 'intimate');
  assert.equal(d.emotionalIntensity, Math.max(...ds.map((x) => x.emotionalIntensity)));
});
test('Modern Editorial is asymmetrical, most expansive and most desaturated', () => {
  const ds = run('graduation').directions;
  const d = directionByName(run('graduation'), 'Modern Editorial')!;
  assert.equal(d.philosophy.balance, 'asymmetrical');
  assert.equal(d.whitespace.level, 'expansive');
  assert.equal(d.treatment.grade.saturate, Math.min(...ds.map((x) => x.treatment.grade.saturate)));
});
test('Family Legacy shows the most supporting photos; Luxury Gold the fewest', () => {
  assert.ok(IDENTITIES['Family Legacy'].supporting.count > IDENTITIES['Luxury Gold'].supporting.count);
});

// ── Storytelling ordering ────────────────────────────────────────────
test('graduation tells portrait → diploma → parents → friends → celebration → cake', () => {
  const photos = [
    photo('a', 'cake_cut.jpg', 2), photo('b', 'friends_group.jpg', 5), photo('c', 'grad_portrait.jpg', 1),
    photo('d', 'confetti_party.jpg', 3), photo('e', 'mom_and_dad.jpg', 3), photo('f', 'diploma_stage.jpg', 1),
  ];
  const o = orderPhotoStory(photos, 'graduation');
  assert.deepEqual(o.flow.map((b) => b.beat), ['portrait', 'diploma', 'parents', 'friends', 'celebration', 'cake']);
  assert.deepEqual(o.ordered.map((p) => p.photoId), ['c', 'f', 'e', 'b', 'd', 'a']);
});
test('storytelling never drops a photo', () => {
  const photos = [photo('a', 'x.jpg'), photo('b', 'y.jpg'), photo('c', 'diploma.jpg')];
  const o = orderPhotoStory(photos, 'graduation');
  assert.equal(o.ordered.length, 3);
  assert.deepEqual(o.ordered.map((p) => p.photoId).sort(), ['a', 'b', 'c']);
});
test('every reorder records a justification — never silent', () => {
  const o = orderPhotoStory([photo('a', 'diploma.jpg'), photo('b', 'cake.jpg')], 'graduation');
  assert.equal(o.flow.length, 2);
  for (const b of o.flow) assert.ok(b.reason.length > 0);
});
test('unclassified photos keep their original relative order, after the story beats', () => {
  const photos = [photo('z1', 'IMG_9001.jpg', 0), photo('d', 'diploma.jpg', 1), photo('z2', 'IMG_9002.jpg', 0)];
  const o = orderPhotoStory(photos, 'graduation');
  assert.deepEqual(o.ordered.map((p) => p.photoId), ['d', 'z1', 'z2']);
  assert.match(o.flow[1].reason, /original order/i);
});
test('face count is a fallback cue when the filename says nothing', () => {
  assert.equal(classifyPhoto(photo('a', 'IMG_1.jpg', 1), STORY_BEATS.graduation).beat, 'portrait');
  assert.equal(classifyPhoto(photo('b', 'IMG_2.jpg', 5), STORY_BEATS.graduation).beat, 'friends');
  assert.equal(classifyPhoto(photo('c', 'IMG_3.jpg', 2), STORY_BEATS.graduation).beat, 'parents');
});
test('"cap_toss" reads as celebration, not portrait', () => {
  assert.equal(classifyPhoto(photo('a', 'cap_toss.jpg', 3), STORY_BEATS.graduation).beat, 'celebration');
});
test('each occasion has its own narrative arc', () => {
  assert.deepEqual(beatsForOccasion('championship').slice(0, 3), ['portrait', 'action', 'team']);
  assert.deepEqual(beatsForOccasion('wedding').slice(0, 3), ['portrait', 'ceremony', 'rings']);
  assert.deepEqual(beatsForOccasion('nope'), DEFAULT_BEATS);
  assert.deepEqual(beatsForOccasion('graduation', ['x', 'y']), ['x', 'y']);
});
test('orderPhotoStory is deterministic and safe on junk', () => {
  const p = [photo('a', 'diploma.jpg')];
  assert.deepEqual(orderPhotoStory(p, 'graduation'), orderPhotoStory(p, 'graduation'));
  assert.deepEqual(orderPhotoStory(null as never, 'graduation').ordered, []);
});
test('the art-directed presentation reorders supporting photos into the story', () => {
  const r = run('graduation');
  const beats = r.directions[0].storytellingFlow.map((b) => b.beat);
  const arc = STORY_BEATS.graduation;
  const ranks = beats.map((b) => arc.indexOf(b));
  for (let i = 1; i < ranks.length; i++) assert.ok(ranks[i] >= ranks[i - 1], 'beats are in narrative order');
});

// ── Card copy ────────────────────────────────────────────────────────
test('every concept has a title, exactly one sentence and exactly three bullets', () => {
  for (const d of run('graduation').directions) {
    assert.equal(d.copy.title, d.conceptName);
    assert.equal(d.copy.bullets.length, 3);
    assert.ok(d.copy.emotionalSentence.length > 10);
    assert.equal((d.copy.emotionalSentence.match(/\./g) || []).length, 1, 'one sentence');
  }
});
test('card copy never contains internal status words', () => {
  const s = JSON.stringify(run('graduation').directions.map((d) => d.copy)).toUpperCase();
  for (const w of ['FALLBACK', 'RENDERED', 'IN REVIEW']) assert.ok(!s.includes(w), `copy must not say ${w}`);
});
test('bullets state the real hero percentage', () => {
  const d = directionByName(run('graduation'), 'Signature Edition')!;
  assert.ok(d.copy.bullets.some((b) => b.includes(`${Math.round(d.hero.dominanceRatio * 100)}%`)));
});
test('each concept has distinct copy', () => {
  const d = run('graduation').directions;
  assert.equal(uniq(d.map((x) => x.copy.emotionalSentence)), 4);
  assert.equal(uniq(d.map((x) => x.copy.bullets)), 4);
});
test('copy adapts to the occasion without inventing a name', () => {
  const grad = emotionalSentence('Signature Edition', 'graduation');
  const wed = emotionalSentence('Signature Edition', 'wedding');
  assert.notEqual(grad, wed);
  for (const s of [grad, wed]) assert.ok(!/\b(sarah|john|jane)\b/i.test(s));
});
test('copyFor/bulletsFor are pure helpers over a direction', () => {
  const d = run('graduation').directions[0] as ArtDirection;
  const partial = { ...d } as Omit<ArtDirection, 'copy'>;
  assert.deepEqual(bulletsFor(partial), d.copy.bullets);
  assert.deepEqual(copyFor(partial, 'graduation'), d.copy);
});

// ── No production regression ─────────────────────────────────────────
test('the existing renderer, orchestrator and adapter are untouched', () => {
  const root = execSync('git rev-parse --show-toplevel', { cwd: here }).toString().trim();
  for (const p of ['shared/render-engine', 'shared/render-orchestrator/src', 'shared/render-adapter/src']) {
    assert.equal(execSync(`git status --porcelain -- ${p}`, { cwd: root }).toString().trim(), '', `${p} must be untouched`);
  }
});
test('index.html is untouched by the art director', () => {
  const root = execSync('git rev-parse --show-toplevel', { cwd: here }).toString().trim();
  assert.equal(execSync('git status --porcelain -- index.html', { cwd: root }).toString().trim(), '');
});
