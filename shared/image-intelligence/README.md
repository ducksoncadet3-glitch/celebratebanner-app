# @celebratebanner/image-intelligence

Pure decision logic that makes rendered WOW concepts look **intentional**. It DECIDES;
the WOW render binding executes. No DOM, no canvas, no I/O, no pixels — and uploaded
files are **never modified**: every correction is applied at draw time, in the WOW
pipeline / render-preview path only.

## Why it exists

The existing renderer's `drawCover` silently switches from *cover* to *contain* when an
image and its box disagree in aspect by more than **1.55×**
(`render-engine/src/canvas/helpers.ts`). A portrait hero in Classic's landscape hero box
exceeds that, so it gets **pillarboxed** — the "weak hero with dead zones" problem.

We never change the renderer. We hand it a hero already cropped to its box's aspect, so
`drawCover` always takes the cover path and the hero fills the frame edge to edge.

## API

| Area | Functions |
|------|-----------|
| Orientation | `planOrientationCorrection`, `detectOrientation`, `normalizeQuarterTurns`, `applyQuarterTurns` |
| Hero | `heroBoxAspect`, `coverCropRect`, `wouldLetterbox`, `heroFillsBox`, `cropRatio`, `enforceHeroDominance` |
| Curation | `curatePhotos`, `hammingDistance`, `isNearDuplicate` |
| Text | `sanitizeBannerText`, `isPlaceholderText`, `DIGNIFIED_LABELS` |

### Orientation
Two signals, with precedence: the **customer's own rotation** (degrees) is authoritative
intent — when present, the mismatch rule is skipped so a stale `declaredOrientation`
can't double-correct the photo back to sideways. Otherwise a declared-vs-actual
orientation mismatch is a "this image is sideways" tell and earns one quarter turn.
Undeterminable dimensions or a square/unknown orientation → **pass through (0 turns)**.

### Hero
`heroBoxAspect` mirrors the renderer's arrangement geometry (read-only — keep in sync):

```
classic  → (W - 80) × 360     pyramid → square
mosaic   → 320 × 380          magazine → 460 × 420
```

`coverCropRect` returns the largest sub-rect of that aspect, centred horizontally and
biased to the **top** (`FACE_SAFE_FOCUS_Y = 0.10`) — without face detection, extra
headroom beats decapitating the subject.

### Curation
`curatePhotos` drops near-identical photos by perceptual-hash Hamming distance, keeping
the first (best-ranked) of each cluster. It **never** drops a photo whose hash is unknown,
and `minKeep` (default 4) stops de-duplication from starving the story.

> **Not wired into the pipeline.** Feeding `perceptualHash` to the Memory Profile makes it
> suppress duplicates natively — but on a 6-photo set with one duplicate that drops the
> supporting count 5 → 4, costing ~1 storytelling point and pushing borderline concepts
> under the 90 masterpiece gate (passing 3/4 → 2/4). Real artwork becomes placeholders — a
> net visual regression. Thumbnails are curated visually instead (uniform square crop +
> unified grade). Re-enable once storytelling weighting or the gate is tuned.

### Text
`sanitizeBannerText` replaces raw builder hints (`"e.g., Sarah Johnson"`, `""`, `"Your name"`,
`"{name}"`) with a dignified occasion label (`"Graduate Name"`). Real customer text is
**always preserved** and a name is **never invented**. A field with no label is dropped
rather than rendered as filler.

## Determinism
No `Date`, `Math.random`, or I/O. Same inputs → same decisions.

```bash
npm test        # node --test 'test/*.test.ts'  (58 tests)
npm run typecheck
```
