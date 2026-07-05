# CelebrateBanner 2.0 — Memory Profile Schema

> **Status:** Draft for review. Implements Sprint 1 of the WOW Engine.
> **Owner:** Duckson Cadet (Founder & CEO), CDN4 LLC (DBA CelebrateBanner)
> **Companions:** [CELEBRATEBANNER_2_0_BLUEPRINT.md](CELEBRATEBANNER_2_0_BLUEPRINT.md) · [CELEBRATEBANNER_DESIGN_BIBLE.md](CELEBRATEBANNER_DESIGN_BIBLE.md) · [WOW_ENGINE_PIPELINE.md](WOW_ENGINE_PIPELINE.md)
> **Implemented by:** `shared/memory-profile/` — sole public function `generateMemoryProfile(uploadedPhotos, options?)`.

---

## What the Memory Profile is

The Memory Profile is the **single source of truth** produced by the AI Creative Director's analysis stage. It transforms raw uploaded photos into structured **celebration intelligence**.

> **No renderer inspects raw photos directly.** Every renderer, scorer, and concept generator consumes the Memory Profile — never the pixels.

This document defines every field the engine produces.

---

## Input contract — `PhotoInput[]`

`generateMemoryProfile(uploadedPhotos, options?)` accepts an array of normalized photo descriptors. The engine never reads pixels; a caller (EXIF reader, canvas sampler, or a future vision stage) supplies optional analysis **signals**. Missing signals degrade gracefully into `warnings` and a lower `confidence_score`.

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | `string` | ✅ | Stable unique id for the photo | `"p1"` |
| `filename` | `string` | ➖ | Original filename (weak occasion hints, display) | `"grad_cap_toss.jpg"` |
| `width` | `number` | ✅ | Pixel width | `4032` |
| `height` | `number` | ✅ | Pixel height | `3024` |
| `bytes` | `number` | ➖ | File size in bytes | `3221225` |
| `faceCount` | `number` | ➖ | Detected faces (from a vision/EXIF stage) | `1` |
| `sharpness` | `number 0–1` | ➖ | Focus/sharpness estimate | `0.82` |
| `brightness` | `number 0–1` | ➖ | Mean luminance | `0.58` |
| `contrast` | `number 0–1` | ➖ | Contrast estimate | `0.61` |
| `dominantColors` | `ColorSwatch[]` | ➖ | Per-photo color swatches | `[{"hex":"#0C0E14","weight":0.6}]` |
| `takenAt` | `string (ISO)` | ➖ | Capture timestamp (grouping, restoration) | `"2026-05-20T18:30:00Z"` |
| `perceptualHash` | `string` | ➖ | Hex perceptual hash (duplicate detection) | `"f0e1c2..."` |
| `isMonochrome` | `boolean` | ➖ | Black-and-white / sepia flag (restoration) | `true` |

`ColorSwatch` = `{ hex: string; weight: number /* 0–1 */ }`.

**Options** — `{ occasion?: OccasionType }` — the occasion chosen in Experience Step 1. When omitted, the engine attempts weak filename detection and lowers confidence.

---

## Output — `MemoryProfile`

Every field below is always present in the output object.

### `occasion`
- **Type:** `OccasionType` (`"graduation" | "championship" | "team" | "wedding" | "birthday" | "baby_shower" | "retirement" | "family_reunion" | "church" | "military" | "corporate" | "memorial" | "senior_night" | "social" | "unknown"`)
- **Description:** The celebration type. Taken from `options.occasion`; otherwise weakly inferred from filenames, else `"unknown"`.
- **Required:** ✅
- **Example:** `"graduation"`

### `style`
- **Type:** `string` (visual style descriptor: `"editorial-classic" | "opulent" | "heartfelt" | "magazine"`)
- **Description:** High-level visual style lean, derived from the recommended concept. A hint to renderers, not a full spec.
- **Required:** ✅
- **Example:** `"editorial-classic"`

### `story`
- **Type:** `string`
- **Description:** A short generated narrative describing the celebration (drives story-first layout).
- **Required:** ✅
- **Example:** `"A graduation milestone anchored by one standout portrait, supported by 4 favorite moments."`

### `mood`
- **Type:** `string`
- **Description:** Dominant emotional tone to design toward (e.g. `"proud"`, `"triumphant"`, `"warm"`, `"reverent"`, `"romantic"`, `"joyful"`), optionally modified by lighting (e.g. `"proud · dramatic"`).
- **Required:** ✅
- **Example:** `"proud"`

### `primary_subject`
- **Type:** `{ type: "individual" | "small_group" | "group" | "unknown"; faceCount: number; sourcePhotoId: string | null }`
- **Description:** The central subject inferred from the hero photo.
- **Required:** ✅
- **Example:** `{ "type": "individual", "faceCount": 1, "sourcePhotoId": "p1" }`

### `hero_photo`
- **Type:** `PhotoSummary | null` — `{ photoId, filename, orientation, score, faceCount, width, height }`
- **Description:** The single strongest, sacred hero photo that anchors every concept. `null` only when no photos are provided.
- **Required:** ✅
- **Example:** `{ "photoId": "p1", "filename": "grad_cap_toss.jpg", "orientation": "portrait", "score": 91, "faceCount": 1, "width": 4032, "height": 3024 }`

### `supporting_photos`
- **Type:** `PhotoSummary[]`
- **Description:** Ranked supporting photos chosen only because they strengthen the hero and the story. May be fewer than uploaded — beauty over quantity.
- **Required:** ✅
- **Example:** `[ { "photoId": "p2", "orientation": "landscape", "score": 74, ... } ]`

### `photo_rankings`
- **Type:** `{ photoId: string; rank: number; compositeScore: number; role: "hero" | "supporting" | "excluded" }[]`
- **Description:** Full ranked list of every uploaded photo with its role.
- **Required:** ✅
- **Example:** `[ { "photoId": "p1", "rank": 1, "compositeScore": 91, "role": "hero" } ]`

### `family_members`
- **Type:** `FamilyMember[]` — `{ id: string; label: string; photoIds: string[] }[]`
- **Description:** Identified recurring people. **Reserved:** requires face-recognition (a future vision stage); currently returned empty with a `warning`.
- **Required:** ✅ (may be empty)
- **Example:** `[]`

### `groups`
- **Type:** `PhotoGroup[]` — `{ label: string; photoIds: string[]; size: number }[]`
- **Description:** Lightweight clusters of photos (by capture day when `takenAt` is present), useful for narrative/timeline layouts.
- **Required:** ✅ (may be empty)
- **Example:** `[ { "label": "2026-05-20", "photoIds": ["p1","p2"], "size": 2 } ]`

### `dominant_colors`
- **Type:** `ColorSwatch[]` — `{ hex: string; weight: number }[]`
- **Description:** Aggregated palette across the selected photos, weighted by photo quality. Falls back to the occasion's default palette (Obsidian/Gold/Ivory + accents) with a `warning` when no color data is supplied.
- **Required:** ✅
- **Example:** `[ { "hex": "#0C0E14", "weight": 0.42 }, { "hex": "#C9A84C", "weight": 0.28 } ]`

### `photo_quality_scores`
- **Type:** `{ photoId: string; quality: number; resolutionScore: number; exposureScore: number; sharpness: number | null }[]`
- **Description:** Per-photo technical quality breakdown (0–100 quality; components 0–1).
- **Required:** ✅
- **Example:** `[ { "photoId": "p1", "quality": 88, "resolutionScore": 1, "exposureScore": 0.95, "sharpness": 0.82 } ]`

### `face_count`
- **Type:** `number`
- **Description:** Total detected faces across all photos (0 when no face data supplied).
- **Required:** ✅
- **Example:** `6`

### `portrait_count`
- **Type:** `number`
- **Description:** Count of portrait-orientation photos.
- **Required:** ✅
- **Example:** `3`

### `landscape_count`
- **Type:** `number`
- **Description:** Count of landscape-orientation photos.
- **Required:** ✅
- **Example:** `2`

> The engine additionally reports `square_count` (additive) for completeness.

### `duplicate_candidates`
- **Type:** `{ group: string[]; keep: string; reason: string }[]`
- **Description:** Groups of near-identical photos (by perceptual-hash distance, else near-identical dimensions + close `takenAt`), with the recommended one to keep.
- **Required:** ✅ (may be empty)
- **Example:** `[ { "group": ["p3","p4"], "keep": "p3", "reason": "near-identical (phash)" } ]`

### `restoration_candidates`
- **Type:** `{ photoId: string; reasons: string[] }[]`
- **Description:** Photos that would benefit from enhancement/restoration (low sharpness, low resolution, monochrome + old capture date).
- **Required:** ✅ (may be empty)
- **Example:** `[ { "photoId": "p7", "reasons": ["low_resolution","monochrome_old"] } ]`

### `recommended_concept`
- **Type:** `ConceptType` (`"Signature Edition" | "Luxury Gold" | "Family Legacy" | "Modern Editorial"`)
- **Description:** The single concept the AI Creative Director recommends leading with, from occasion + subject shape. (All four are still generated downstream; this is the lead.)
- **Required:** ✅
- **Example:** `"Signature Edition"`

### `confidence_score`
- **Type:** `number` (0–100)
- **Description:** Engine confidence in this profile. Reduced by missing occasion, absent analysis signals, low photo count, and defaulted colors.
- **Required:** ✅
- **Example:** `82`

### `warnings`
- **Type:** `{ code: string; message: string; severity: "info" | "warning" }[]`
- **Description:** Non-fatal notes about missing data or curation decisions (e.g. `occasion_not_provided`, `limited_photo_analysis`, `low_photo_count`, `no_color_data`, `all_low_quality`, `no_faces_detected`, `duplicates_detected`, `restoration_recommended`).
- **Required:** ✅ (may be empty)
- **Example:** `[ { "code": "limited_photo_analysis", "message": "...", "severity": "info" } ]`

### `future_extension_fields`
- **Type:** `object`
- **Description:** Reserved namespace for later stages so the schema can grow without breaking consumers. Keys are present and `null` until implemented: `faceRecognition`, `aiVision`, `expressionAnalysis`, `textDetection`.
- **Required:** ✅
- **Example:** `{ "faceRecognition": null, "aiVision": null, "expressionAnalysis": null, "textDetection": null }`

### `schema_version` (meta)
- **Type:** `string`
- **Description:** Version of this schema the profile conforms to (additive meta field).
- **Required:** ✅
- **Example:** `"1.0.0"`

---

## Determinism

The engine is **deterministic**: identical input always yields an identical Memory Profile. It uses no `Date.now()`, no randomness, and no I/O — so profiles are safe to snapshot in tests and cache. (This mirrors the determinism contract of `shared/render-engine`.)

---

## Guardrails for This Phase

Additive only. The Memory Profile Engine does not modify the current renderer, `index.html`, `server.js`, pricing, checkout, or email. No commit/push until approved.
