# CelebrateBanner 2.0 — Creative Brief Schema

> **Status:** Draft for review. Implements Sprint 2 of the WOW Engine.
> **Owner:** Duckson Cadet (Founder & CEO), CDN4 LLC (DBA CelebrateBanner)
> **Companions:** [CELEBRATEBANNER_2_0_BLUEPRINT.md](CELEBRATEBANNER_2_0_BLUEPRINT.md) · [CELEBRATEBANNER_DESIGN_BIBLE.md](CELEBRATEBANNER_DESIGN_BIBLE.md) · [WOW_ENGINE_PIPELINE.md](WOW_ENGINE_PIPELINE.md) · [MEMORY_PROFILE_SCHEMA.md](MEMORY_PROFILE_SCHEMA.md)
> **Implemented by:** `shared/creative-brief/` — sole public function `generateCreativeBrief(memoryProfile, options?)`.

---

## What the Creative Brief is

The **Memory Profile** tells us *what the uploaded photos contain*.
The **Creative Brief** decides *how the celebration story should be told*.

It is the bridge in the WOW Engine pipeline:

```
Memory Profile → Creative Brief → Four Premium Concepts → WOW Score → Reveal UI
```

The Creative Brief is the AI Creative Director's *direction* — the emotional, narrative, and visual instructions that every one of the four concepts is built against. It reads a Memory Profile and never touches raw photos.

---

## Input contract

`generateCreativeBrief(memoryProfile, options?)`

- **`memoryProfile`** — a `MemoryProfile` (see [MEMORY_PROFILE_SCHEMA.md](MEMORY_PROFILE_SCHEMA.md)). Consumed read-only; never mutated.
- **`options`** *(optional)* — `{ now?: string | null }`. A timestamp string to stamp `createdAt`. Defaults to `null` to preserve determinism; a persistence layer supplies it when saving.

---

## Output — `CreativeBrief`

Every field below is always present in the output object.

### `schemaVersion`
- **Type:** `string`
- **Description:** Version of this schema the brief conforms to.
- **Required:** ✅
- **Example:** `"1.0.0"`

### `briefId`
- **Type:** `string`
- **Description:** Stable, **deterministic** id derived from the profile's key fields (same profile → same id). Format `brief_<8 hex>`.
- **Required:** ✅
- **Example:** `"brief_1a2b3c4d"`

### `createdAt`
- **Type:** `string | null` (ISO 8601 when set)
- **Description:** Creation timestamp. `null` in the pure engine (kept deterministic); stamped by the caller/persistence layer via `options.now`.
- **Required:** ✅ (may be `null`)
- **Example:** `null`

### `occasion`
- **Type:** `OccasionType` (from memory-profile)
- **Description:** The celebration type, carried through from the Memory Profile.
- **Required:** ✅
- **Example:** `"graduation"`

### `recommendedConcept`
- **Type:** `ConceptType` (`"Signature Edition" | "Luxury Gold" | "Family Legacy" | "Modern Editorial"`)
- **Description:** The lead concept the brief directs toward. Carried from the Memory Profile's `recommended_concept`; if absent/invalid, re-derived from occasion + subject.
- **Required:** ✅
- **Example:** `"Signature Edition"`

### `emotionalDirection`
- **Type:** `{ primary: string; keywords: string[]; statement: string }`
- **Description:** The dominant feeling to design toward, its supporting keywords, and a one-line emotional statement.
- **Required:** ✅
- **Example:** `{ "primary": "pride", "keywords": ["pride","achievement","future"], "statement": "Celebrate the pride of a milestone earned and the promise of what's next." }`

### `storyAngle`
- **Type:** `string`
- **Description:** The narrative angle every concept should express.
- **Required:** ✅
- **Example:** `"A journey of perseverance leading to graduation."`

### `primaryMessage`
- **Type:** `{ suggestion: string; guidance: string }`
- **Description:** The strongest textual statement and how to treat it. `suggestion` may contain `{placeholders}` the customer fills in.
- **Required:** ✅
- **Example:** `{ "suggestion": "{Graduate Name}", "guidance": "Set as the dominant statement, second only to the hero photo." }`

### `secondaryMessage`
- **Type:** `{ suggestion: string; guidance: string }`
- **Description:** The supporting textual statement and how to treat it.
- **Required:** ✅
- **Example:** `{ "suggestion": "Class of {Year}", "guidance": "Refined gold label; never competes with the name." }`

### `heroStrategy`
- **Type:** `{ heroPhotoId: string | null; rationale: string; dominance: "commanding" | "strong" | "balanced"; dominanceRatio: number; supportingRole: string }`
- **Description:** Why the hero is strongest, how dominant it should be (`dominanceRatio` = fractional visual weight, 0–1), and how supporting photos serve it.
- **Required:** ✅
- **Example:** `{ "heroPhotoId": "g1", "rationale": "Photo g1 (grad_portrait.jpg) is strongest: portrait, score 93, 1 clear subject.", "dominance": "commanding", "dominanceRatio": 0.62, "supportingRole": "All supporting photos frame and lead the eye back to the hero." }`

### `supportingPhotoStrategy`
- **Type:** `{ hierarchy: { tier: "emotional_anchor" | "story_builder" | "accent"; photoIds: string[]; role: string }[]; maxRecommended: number; guidance: string }`
- **Description:** The tiered photo hierarchy beneath the hero, the recommended count cap, and curation guidance.
- **Required:** ✅
- **Example:** `{ "hierarchy": [ { "tier": "emotional_anchor", "photoIds": ["g2"], "role": "..." } ], "maxRecommended": 3, "guidance": "Beauty over quantity; cut anything that weakens the composition." }`

### `colorDirection`
- **Type:** `{ palette: { hex: string; role: string }[]; primary: string; accent: string; neutral: string; source: "photos" | "occasion-default"; guidance: string }`
- **Description:** The color plan — derived from the profile's dominant colors, layered on the celebration palette, with the Obsidian/Gold/Ivory brand core guaranteed present.
- **Required:** ✅
- **Example:** `{ "palette": [ { "hex": "#0C0E14", "role": "ground" }, { "hex": "#C9A84C", "role": "accent" } ], "primary": "#0C0E14", "accent": "#C9A84C", "neutral": "#FAF8F3", "source": "photos", "guidance": "..." }`

### `typographyDirection`
- **Type:** `{ style: "elegant" | "bold" | "editorial" | "legacy" | "respectful"; displayFont: string; supportingFont: string; guidance: string }`
- **Description:** The type voice, chosen from concept + occasion. Fonts are fixed to the brand (Cormorant Garamond + Outfit).
- **Required:** ✅
- **Example:** `{ "style": "elegant", "displayFont": "Cormorant Garamond", "supportingFont": "Outfit", "guidance": "..." }`

### `compositionDirection`
- **Type:** `{ layout: string; balance: string; whitespace: string; guidance: string }`
- **Description:** Layout, balance (symmetry/asymmetry), and whitespace direction for the concepts.
- **Required:** ✅
- **Example:** `{ "layout": "Central hero with a disciplined supporting grid.", "balance": "symmetrical", "whitespace": "generous", "guidance": "..." }`

### `decorativeDirection`
- **Type:** `{ allowed: string[]; forbidden: string[]; guidance: string }`
- **Description:** Decorative effects permitted and forbidden for this occasion/concept (per the Design Bible).
- **Required:** ✅
- **Example:** `{ "allowed": ["thin gold accent lines","subtle spotlight"], "forbidden": ["clip art","confetti overload"], "guidance": "..." }`

### `productIntent`
- **Type:** `{ recommendedProducts: string[]; primaryProduct: string; guidance: string }`
- **Description:** Which products this celebration leans toward (from the ecosystem/revenue model). Never sets or changes pricing.
- **Required:** ✅
- **Example:** `{ "recommendedProducts": ["Framed","Premium print","Standard print","Digital download"], "primaryProduct": "Framed", "guidance": "..." }`

### `audienceIntent`
- **Type:** `{ primaryAudience: string; sharingContext: string; guidance: string }`
- **Description:** Who this is for and how it will be shared — informs tone and shareability.
- **Required:** ✅
- **Example:** `{ "primaryAudience": "the graduate and immediate family", "sharingContext": "shared with extended family before purchase", "guidance": "..." }`

### `personalizationSuggestions`
- **Type:** `string[]`
- **Description:** Optional light personalization prompts (Experience Step 5). Never required of the customer.
- **Required:** ✅ (may be empty)
- **Example:** `["Graduate's name","School & class year","Optional short quote"]`

### `upsellOpportunities`
- **Type:** `string[]`
- **Description:** Celebration-Collection and add-on opportunities (Sprint 2 / revenue model). Descriptive only — no prices.
- **Required:** ✅ (may be empty)
- **Example:** `["Matching social graphic","Phone wallpaper","Thank-you card","Extra prints"]`

### `wowTargets`
- **Type:** `{ overallTarget: number; emphasis: string[]; guidance: string }`
- **Description:** The WOW Score gate (`overallTarget` = 90) and which scoring categories this brief prioritizes, so downstream generation and scoring know where to push.
- **Required:** ✅
- **Example:** `{ "overallTarget": 90, "emphasis": ["Layout Balance","Typography","Luxury Finish"], "guidance": "Never present a concept below 90." }`

### `riskWarnings`
- **Type:** `{ code: string; message: string; severity: "info" | "warning" }[]`
- **Description:** Creative risks detected from the Memory Profile — e.g. `too_few_photos`, `weak_hero`, `low_confidence`, `duplicate_heavy`, `restoration_needed`, `mixed_orientation_conflict`, `overcrowding_risk`.
- **Required:** ✅ (may be empty)
- **Example:** `[ { "code": "weak_hero", "message": "Hero photo scored below the strong threshold.", "severity": "warning" } ]`

### `confidenceScore`
- **Type:** `number` (0–100)
- **Description:** Confidence in this brief. Seeded from the Memory Profile's `confidence_score`, adjusted down for weak/absent hero and detected risks. Always bounded 0–100.
- **Required:** ✅
- **Example:** `92`

---

## Determinism

The engine is **deterministic**: identical input (and `options`) always yields an identical Creative Brief. No `Date.now()`, no randomness, no I/O. `createdAt` is `null` unless a caller supplies `options.now`. (Mirrors `@celebratebanner/memory-profile` and `@celebratebanner/render-engine`.)

---

## Guardrails for This Phase

Additive only. The Creative Brief Engine does not modify the current renderer, `index.html`, `server.js`, pricing, checkout, or the memory-profile engine. No commit/push until approved.
