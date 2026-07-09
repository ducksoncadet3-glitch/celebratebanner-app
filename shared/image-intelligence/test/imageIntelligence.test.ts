/**
 * Image Intelligence tests. Node's built-in runner (no deps):
 *   node --test 'test/*.test.ts'
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import {
  detectOrientation, normalizeQuarterTurns, applyQuarterTurns, planOrientationCorrection,
  aspect, cropRatio, wouldLetterbox, heroFillsBox, heroBoxAspect, coverCropRect, enforceHeroDominance,
  CONTAIN_THRESHOLD, FACE_SAFE_FOCUS_Y, SUPPORTING_ASPECT,
  hammingDistance, isNearDuplicate, curatePhotos, DEFAULT_MIN_KEEP,
  isPlaceholderText, sanitizeBannerText, SCHEMA_VERSION,
} from '../src/index.ts';
import { wowLayoutFor, WOW_SUPPORTING_CAP } from '../../render-engine/src/arrangements/wow-geometry.ts';
import type { ArrangementId } from '../src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const ARRANGEMENTS: ArrangementId[] = ['classic', 'magazine', 'mosaic', 'pyramid'];
const PREVIEW_W = 600, PREVIEW_H = 900; // the WOW preview canvas for a 2:3 poster

test('SCHEMA_VERSION is exported', () => assert.equal(typeof SCHEMA_VERSION, 'string'));

// ── Orientation: detection ───────────────────────────────────────────
test('detectOrientation classifies portrait / landscape / square', () => {
  assert.equal(detectOrientation(3000, 4000), 'portrait');
  assert.equal(detectOrientation(4000, 3000), 'landscape');
  assert.equal(detectOrientation(1000, 1000), 'square');
});
test('detectOrientation treats near-square within tolerance as square', () => {
  assert.equal(detectOrientation(1000, 1010), 'square');
});
test('detectOrientation is safe on invalid dimensions', () => {
  assert.equal(detectOrientation(0, 0), 'square');
  assert.equal(detectOrientation(-5, 10), 'square');
});

// ── Orientation: quarter turns ───────────────────────────────────────
test('normalizeQuarterTurns accepts degrees', () => {
  assert.equal(normalizeQuarterTurns(0), 0);
  assert.equal(normalizeQuarterTurns(90), 1);
  assert.equal(normalizeQuarterTurns(180), 2);
  assert.equal(normalizeQuarterTurns(270), 3);
  assert.equal(normalizeQuarterTurns(360), 0);
  assert.equal(normalizeQuarterTurns(450), 1);
});
test('normalizeQuarterTurns accepts negative degrees', () => {
  assert.equal(normalizeQuarterTurns(-90), 3);
});
test('normalizeQuarterTurns falls back to 0 on junk', () => {
  for (const junk of [undefined, null, NaN, 'abc', {}, Infinity]) assert.equal(normalizeQuarterTurns(junk), 0);
});
test('applyQuarterTurns swaps dimensions on odd turns only', () => {
  assert.deepEqual(applyQuarterTurns(3000, 4000, 1), { width: 4000, height: 3000 });
  assert.deepEqual(applyQuarterTurns(3000, 4000, 3), { width: 4000, height: 3000 });
  assert.deepEqual(applyQuarterTurns(3000, 4000, 2), { width: 3000, height: 4000 });
  assert.deepEqual(applyQuarterTurns(3000, 4000, 0), { width: 3000, height: 4000 });
});

// ── Orientation: the correction plan (rotated image handling) ────────
test('rotated image: the customer 90° rotation is honored', () => {
  const r = planOrientationCorrection({ width: 3000, height: 4000, userRotationDegrees: 90 });
  assert.equal(r.quarterTurns, 1);
  assert.equal(r.corrected, true);
  assert.deepEqual([r.effective.width, r.effective.height], [4000, 3000]);
  assert.equal(r.effective.orientation, 'landscape');
});
test('rotated image: a user rotation is NOT double-corrected by the mismatch rule', () => {
  // declaredOrientation is stale (derived pre-rotation) — correcting twice would put it back sideways.
  const r = planOrientationCorrection({ width: 3000, height: 4000, userRotationDegrees: 90, declaredOrientation: 'portrait' });
  assert.equal(r.quarterTurns, 1);
  assert.equal(r.effective.orientation, 'landscape');
});
test('sideways image with no user rotation is reconciled to the declared orientation', () => {
  const r = planOrientationCorrection({ width: 4000, height: 3000, declaredOrientation: 'portrait' });
  assert.equal(r.quarterTurns, 1);
  assert.equal(r.effective.orientation, 'portrait');
  assert.match(r.reason, /sideways|expected to be portrait/i);
});
test('an already-correct image is left untouched', () => {
  const r = planOrientationCorrection({ width: 3000, height: 4000, declaredOrientation: 'portrait' });
  assert.equal(r.quarterTurns, 0);
  assert.equal(r.corrected, false);
});
test('fallback: undeterminable dimensions never guess', () => {
  const r = planOrientationCorrection({ width: 0, height: 0, declaredOrientation: 'portrait' });
  assert.equal(r.quarterTurns, 0);
  assert.equal(r.corrected, false);
  assert.match(r.reason, /unavailable/i);
});
test('fallback: a square or unknown declared orientation triggers no correction', () => {
  assert.equal(planOrientationCorrection({ width: 4000, height: 3000, declaredOrientation: 'square' }).quarterTurns, 0);
  assert.equal(planOrientationCorrection({ width: 4000, height: 3000, declaredOrientation: null }).quarterTurns, 0);
  assert.equal(planOrientationCorrection({ width: 4000, height: 3000, declaredOrientation: 'nonsense' }).quarterTurns, 0);
});
test('orientation planning is deterministic', () => {
  const input = { width: 3000, height: 4000, userRotationDegrees: 270, declaredOrientation: 'portrait' as const };
  assert.deepEqual(planOrientationCorrection(input), planOrientationCorrection(input));
});

// ── Hero: aspect + letterbox detection ───────────────────────────────
test('cropRatio is symmetric and never below 1', () => {
  assert.equal(cropRatio(2, 1), 2);
  assert.equal(cropRatio(1, 2), 2);
  assert.equal(cropRatio(1.5, 1.5), 1);
});
test('wouldLetterbox mirrors the renderer 1.55 contain threshold', () => {
  assert.equal(CONTAIN_THRESHOLD, 1.55);
  assert.equal(wouldLetterbox(1, 1.5), false);
  assert.equal(wouldLetterbox(1, 1.6), true);
});
test('heroFillsBox is the inverse of wouldLetterbox', () => {
  assert.equal(heroFillsBox(1, 1.5), true);
  assert.equal(heroFillsBox(1, 1.6), false);
});

// ── Hero: box geometry mirrors the renderer ──────────────────────────
test('heroBoxAspect returns each arrangement box aspect', () => {
  assert.ok(Math.abs(heroBoxAspect('classic', PREVIEW_W) - (PREVIEW_W - 80) / 360) < 1e-9);
  assert.equal(heroBoxAspect('pyramid', PREVIEW_W), 1);
  assert.ok(Math.abs(heroBoxAspect('mosaic', PREVIEW_W) - 320 / 380) < 1e-9);
  assert.ok(Math.abs(heroBoxAspect('magazine', PREVIEW_W) - 460 / 420) < 1e-9);
});
// ── Sprint 15: the WOW hero box ──────────────────────────────────────
test('the default heroBoxAspect is unchanged (standard mode is the default)', () => {
  for (const arr of ['classic', 'pyramid', 'mosaic', 'magazine']) {
    assert.equal(heroBoxAspect(arr, PREVIEW_W, 900), heroBoxAspect(arr, PREVIEW_W, 900, 'standard'), arr);
  }
});
test('in wow mode only classic changes: its hero grows to ~55% of the canvas', () => {
  assert.ok(Math.abs(heroBoxAspect('classic', 600, 900, 'wow') - 520 / (900 * 0.55)) < 1e-9);
  assert.equal(heroBoxAspect('pyramid', 600, 900, 'wow'), 1);
  assert.ok(Math.abs(heroBoxAspect('mosaic', 600, 900, 'wow') - 320 / 380) < 1e-9);
  assert.ok(Math.abs(heroBoxAspect('magazine', 600, 900, 'wow') - 460 / 420) < 1e-9);
});
test('wow classic falls back to the standard box when no canvas height is known', () => {
  assert.equal(heroBoxAspect('classic', 600, undefined, 'wow'), heroBoxAspect('classic', 600));
  assert.equal(heroBoxAspect('classic', 600, 0, 'wow'), heroBoxAspect('classic', 600));
});
test('the wow hero box mirrors the REAL wow geometry: the hero always fills its frame', () => {
  // Imported straight from the renderer so this mirror can never silently drift.
  // wow-geometry.ts is dependency-free, which is what makes this import safe.
  for (const [W, H] of [[600, 900], [800, 1200], [520, 780], [900, 700]] as const) {
    for (const arr of ['classic', 'pyramid', 'mosaic', 'magazine'] as const) {
      for (let n = 2; n <= WOW_SUPPORTING_CAP[arr]; n++) {
        const { hero } = wowLayoutFor(arr, W, H, 200, n);
        const box = aspect(hero.w, hero.h);
        const prepared = heroBoxAspect(arr, W, H, 'wow');   // the aspect we pre-crop the hero to
        assert.ok(heroFillsBox(prepared, box), `${arr} ${W}x${H}/${n}: cropRatio ${cropRatio(prepared, box).toFixed(2)}`);
      }
    }
  }
});
test('heroBoxAspect degrades safely on tiny/unknown input', () => {
  assert.equal(heroBoxAspect('classic', 40), 1);
  assert.equal(heroBoxAspect('nope', PREVIEW_W), 1);
});

// ── Hero: the defect this sprint fixes ───────────────────────────────
test('BEFORE: a portrait hero letterboxes in the classic (landscape) hero box', () => {
  assert.equal(wouldLetterbox(aspect(3000, 4000), heroBoxAspect('classic', PREVIEW_W)), true);
});
test('BEFORE: a landscape hero letterboxes in the mosaic (portrait) hero box', () => {
  assert.equal(wouldLetterbox(aspect(4000, 3000), heroBoxAspect('mosaic', PREVIEW_W)), true);
});
test('AFTER: pre-cropping the hero to its box aspect fills every arrangement', () => {
  for (const arr of ARRANGEMENTS) {
    const box = heroBoxAspect(arr, PREVIEW_W, PREVIEW_H);
    assert.equal(heroFillsBox(box, box), true, `${arr} should fill after pre-crop`);
    assert.equal(wouldLetterbox(box, box), false, `${arr} must have no dead zones`);
  }
});
test('portrait poster with a landscape photo: crop rect fills the box with no dead zone', () => {
  const box = heroBoxAspect('mosaic', PREVIEW_W); // portrait box (320/380)
  const r = coverCropRect(4000, 3000, box);       // landscape source
  assert.ok(Math.abs(aspect(r.sw, r.sh) - box) < 1e-6, 'cropped source matches the box aspect');
  assert.equal(wouldLetterbox(aspect(r.sw, r.sh), box), false);
});
test('landscape poster box with a portrait photo: crop rect fills the box', () => {
  const box = heroBoxAspect('classic', PREVIEW_W); // landscape box
  const r = coverCropRect(3000, 4000, box);
  assert.ok(Math.abs(aspect(r.sw, r.sh) - box) < 1e-6);
  assert.equal(wouldLetterbox(aspect(r.sw, r.sh), box), false);
});

// ── Hero: crop never leaves the source, and protects faces ───────────
test('coverCropRect always stays inside the source image', () => {
  for (const [w, h, t] of [[4000, 3000, 0.84], [3000, 4000, 1.44], [1000, 1000, 2.0], [1000, 1000, 0.5]] as [number, number, number][]) {
    const r = coverCropRect(w, h, t);
    assert.ok(r.sx >= 0 && r.sy >= 0, 'origin inside source');
    assert.ok(r.sx + r.sw <= w + 1e-6, 'right edge inside source');
    assert.ok(r.sy + r.sh <= h + 1e-6, 'bottom edge inside source');
  }
});
test('coverCropRect biases the crop upward to protect faces', () => {
  const r = coverCropRect(3000, 4000, 1.444); // tall source, wide target → crop height
  const centered = (4000 - r.sh) / 2;
  assert.ok(r.sy < centered, 'keeps the upper (face) region rather than centering');
  // A head near the top of the frame must survive the crop.
  const headTop = 4000 * 0.065;
  assert.ok(r.sy <= headTop, `crop top ${r.sy} must not clip a head at ${headTop}`);
  assert.equal(FACE_SAFE_FOCUS_Y, 0.10);
});
test('coverCropRect centers horizontally when cropping width', () => {
  const r = coverCropRect(4000, 3000, 0.8); // wide source, tall target → crop width
  assert.ok(Math.abs(r.sx - (4000 - r.sw) / 2) < 1e-6);
  assert.equal(r.sy, 0);
});
test('coverCropRect is safe on degenerate input', () => {
  const r = coverCropRect(0, 0, 0);
  assert.ok(r.sw > 0 && r.sh > 0);
});

// ── Hero dominance ───────────────────────────────────────────────────
test('enforceHeroDominance keeps the hero dominant (never below the floor)', () => {
  assert.equal(enforceHeroDominance(0.2), 0.5);
  assert.equal(enforceHeroDominance(0.62), 0.62);
  assert.equal(enforceHeroDominance(0.99), 0.85);
  assert.equal(enforceHeroDominance(NaN), 0.5);
});
test('enforceHeroDominance never reduces a valid in-range dominance', () => {
  for (const d of [0.5, 0.6, 0.7, 0.8, 0.85]) assert.equal(enforceHeroDominance(d), d);
});

// ── Curation: near-duplicate thumbnails ──────────────────────────────
test('hammingDistance counts differing bits', () => {
  assert.equal(hammingDistance('00', '00'), 0);
  assert.equal(hammingDistance('00', '01'), 1);
  assert.equal(hammingDistance('00', 'ff'), 8);
});
test('hammingDistance rejects unusable input with Infinity', () => {
  assert.equal(hammingDistance(null, 'ff'), Infinity);
  assert.equal(hammingDistance('ff', 'ffff'), Infinity);
  assert.equal(hammingDistance('zz', 'ff'), Infinity);
});
test('isNearDuplicate honors the distance threshold', () => {
  assert.equal(isNearDuplicate('ffff0000ffff0000', 'ffff0000ffff0001', 8), true);
  assert.equal(isNearDuplicate('ffff0000ffff0000', '0000ffff0000ffff', 8), false);
});
test('curation drops near-identical thumbnails and keeps the first of each cluster', () => {
  const r = curatePhotos([
    { id: 'p1', perceptualHash: 'ffff0000ffff0000' },
    { id: 'p2', perceptualHash: 'ffff0000ffff0001' }, // near-dup of p1
    { id: 'p3', perceptualHash: '0000ffff0000ffff' },
  ], { minKeep: 0 });
  assert.deepEqual(r.kept.map((p) => p.id), ['p1', 'p3']);
  assert.equal(r.dropped.length, 1);
  assert.equal(r.dropped[0].duplicateOf, 'p1');
});
test('curation never drops a photo whose hash is unknown', () => {
  const r = curatePhotos([{ id: 'a', perceptualHash: null }, { id: 'b' }, { id: 'c', perceptualHash: undefined }]);
  assert.deepEqual(r.kept.map((p) => p.id), ['a', 'b', 'c']);
  assert.deepEqual(r.dropped, []);
});
test('curation preserves upstream ranking order', () => {
  const r = curatePhotos([{ id: 'best', perceptualHash: '00' }, { id: 'mid', perceptualHash: 'f0' }, { id: 'last', perceptualHash: '0f' }], { maxDistance: 0, minKeep: 0 });
  assert.deepEqual(r.kept.map((p) => p.id), ['best', 'mid', 'last']);
});
test('curation honors an optional limit', () => {
  const r = curatePhotos([{ id: 'a' }, { id: 'b' }, { id: 'c' }], { limit: 2 });
  assert.equal(r.kept.length, 2);
});
test('curation handles empty / junk input', () => {
  assert.deepEqual(curatePhotos([]).kept, []);
  assert.deepEqual(curatePhotos(null as never).kept, []);
});
test('curation never starves the story: minKeep restores best-ranked duplicates', () => {
  // Six burst shots of the same moment — all near-identical.
  const burst = Array.from({ length: 6 }, (_, i) => ({ id: 'p' + i, perceptualHash: 'ffff0000ffff000' + i.toString(16) }));
  const r = curatePhotos(burst); // default minKeep = 4
  assert.equal(r.kept.length, DEFAULT_MIN_KEEP, 'the story keeps four memories');
  assert.deepEqual(r.kept.map((p) => p.id), ['p0', 'p1', 'p2', 'p3'], 'best-ranked restored, original order kept');
});
test('minKeep can never exceed the photos actually supplied', () => {
  const r = curatePhotos([{ id: 'a', perceptualHash: '00' }, { id: 'b', perceptualHash: '00' }]);
  assert.equal(r.kept.length, 2);
});
test('curation with abundant distinct photos drops only true duplicates', () => {
  const items = [
    { id: 'a', perceptualHash: '0000000000000000' },
    { id: 'b', perceptualHash: 'ffffffffffffffff' },
    { id: 'c', perceptualHash: '00ff00ff00ff00ff' },
    { id: 'd', perceptualHash: 'ff00ff00ff00ff00' },
    { id: 'e', perceptualHash: '0000000000000001' }, // near-dup of a
  ];
  const r = curatePhotos(items);
  assert.deepEqual(r.kept.map((p) => p.id), ['a', 'b', 'c', 'd']);
  assert.equal(r.dropped[0].id, 'e');
});
test('SUPPORTING_ASPECT gives every thumbnail the same disciplined crop', () => {
  assert.equal(SUPPORTING_ASPECT, 1);
});

// ── Text: placeholder cleanup ────────────────────────────────────────
test('isPlaceholderText recognizes builder hints', () => {
  for (const s of ['', '   ', 'e.g., Sarah Johnson', 'E.g. Sarah', 'Your name', 'Enter your name', '{name}', '[name]', 'TBD', 'sample']) {
    assert.equal(isPlaceholderText(s), true, s);
  }
});
test('isPlaceholderText leaves real customer text alone', () => {
  for (const s of ['Sarah Johnson', 'Jordan', '2026', 'Westview High']) assert.equal(isPlaceholderText(s), false, s);
});
test('isPlaceholderText treats non-strings as placeholders', () => {
  assert.equal(isPlaceholderText(undefined), true);
  assert.equal(isPlaceholderText(42), true);
});
test('placeholder name cleanup: "e.g., Sarah Johnson" → "Graduate Name"', () => {
  const out = sanitizeBannerText({ name: 'e.g., Sarah Johnson' }, 'graduation');
  assert.equal(out.name, 'Graduate Name');
});
test('real customer text is never overwritten (and never invented)', () => {
  const out = sanitizeBannerText({ name: 'Sarah Johnson', year: '2026' }, 'graduation');
  assert.equal(out.name, 'Sarah Johnson');
  assert.equal(out.year, '2026');
});
test('an "e.g., …" hint never promotes its example into the keepsake', () => {
  // The whole value is a builder hint — we must NOT ship "Westview High" as if typed.
  assert.equal(sanitizeBannerText({ school: 'e.g. Westview High' }, 'graduation').school, 'School Name');
  assert.equal(sanitizeBannerText({ name: 'e.g., Sarah Johnson' }, 'graduation').name, 'Graduate Name');
});
test('real text is preserved verbatim (only trimmed)', () => {
  assert.equal(sanitizeBannerText({ school: '  Westview High  ' }, 'graduation').school, 'Westview High');
});
test('empty fields become dignified labels for the occasion', () => {
  const out = sanitizeBannerText({ name: '', year: '', school: '' }, 'graduation');
  assert.deepEqual(out, { name: 'Graduate Name', year: 'Class Year', school: 'School Name' });
});
test('fields with no dignified label are dropped, never rendered as filler', () => {
  const out = sanitizeBannerText({ name: '', mascot: '' }, 'graduation');
  assert.ok('name' in out);
  assert.ok(!('mascot' in out), 'no "Your mascot" filler');
});
test('other occasions get their own dignified labels', () => {
  assert.equal(sanitizeBannerText({ name: '' }, 'championship').name, 'Team Name');
  assert.equal(sanitizeBannerText({ name: '' }, 'wedding').name, 'The Couple');
  assert.equal(sanitizeBannerText({ name: '' }, 'memorial').name, 'In Loving Memory');
});
test('an unknown occasion drops placeholder fields rather than inventing text', () => {
  assert.deepEqual(sanitizeBannerText({ name: '' }, 'unknown'), {});
});
test('sanitizeBannerText is safe on junk input', () => {
  assert.deepEqual(sanitizeBannerText(null, 'graduation'), {});
  assert.deepEqual(sanitizeBannerText(undefined, 'graduation'), {});
});
test('sanitizeBannerText is deterministic', () => {
  const input = { name: 'e.g., Sarah Johnson', year: '2026' };
  assert.deepEqual(sanitizeBannerText(input, 'graduation'), sanitizeBannerText(input, 'graduation'));
});

// ── No pixels · renderer untouched ───────────────────────────────────
test('this module reads no pixels and emits no image data', () => {
  const s = JSON.stringify({
    o: planOrientationCorrection({ width: 3000, height: 4000, userRotationDegrees: 90 }),
    c: coverCropRect(4000, 3000, 1.4),
    t: sanitizeBannerText({ name: '' }, 'graduation'),
  }).toLowerCase();
  for (const bad of ['data:image', 'base64', '<canvas', '<svg']) assert.ok(!s.includes(bad));
});
// Sprint 15 extends the renderer for the first time. The invariant is no longer
// "no diff at all" but "every existing line survives": the standard path is reached
// whenever `renderMode` is absent, so the default builder cannot regress.
test('the existing renderer is extended, never rewritten (0 deletions)', () => {
  const root = execSync('git rev-parse --show-toplevel', { cwd: here }).toString().trim();
  const numstat = execSync('git diff --numstat -- shared/render-engine/src', { cwd: root }).toString().trim();
  for (const line of numstat.split('\n').filter(Boolean)) {
    const [, deleted, file] = line.split(/\s+/);
    assert.equal(deleted, '0', `${file}: ${deleted} line(s) deleted — renderer changes must be additive`);
  }
});
