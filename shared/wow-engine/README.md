# @celebratebanner/wow-engine

The **WOW Engine** — the art-direction, scoring, and gate stages of the
[WOW Engine Pipeline](../../docs/WOW_ENGINE_PIPELINE.md) (Stages 6–8).

It consumes a **Memory Profile** + **Creative Brief** and produces a
**`WOWPresentation`**: four art-directed premium concepts, each scored against the
100-point WOW rubric and gated at 90.

> **It decides WHAT to show. The renderer later decides HOW to paint it.**
> No HTML, no Canvas, no images, no pixels — creative decisions only.

Governed by the [Creative Constitution](../../docs/CREATIVE_CONSTITUTION.md) and the
[Design Bible](../../docs/CELEBRATEBANNER_DESIGN_BIBLE.md). Full experience spec:
[WOW Engine Specification](../../docs/WOW_ENGINE_SPECIFICATION.md).

---

## Public API — one function

```ts
import { generateWOWPresentation } from '@celebratebanner/wow-engine';

const presentation = generateWOWPresentation(memoryProfile, creativeBrief, options?);
// options?: { now?: string | null }  // stamps createdAt; omit to stay deterministic
```

Inputs are the real upstream schemas — [`MemoryProfile`](../memory-profile) and
[`CreativeBrief`](../creative-brief) — consumed read-only, never mutated.

---

## `WOWPresentation`

| Field | Type | Notes |
|-------|------|-------|
| `schemaVersion` | `string` | e.g. `"1.0.0"` |
| `version` | `string` | engine version |
| `createdAt` | `string \| null` | `null` unless `options.now` supplied (determinism) |
| `occasion` | `OccasionType` | carried from the profile |
| `recommendedConcept` | `ConceptType` | the lead concept, from the brief |
| `masterpiecePassed` | `boolean` | `true` only if **all four** concepts clear 90 |
| `overallWOWScore` | `number` | rounded average of the four concept scores |
| `concepts` | `WowConcept[]` | **exactly four**, in canonical order |

### The four concepts (Design Bible Part 5, always in this order)
`Signature Edition` · `Luxury Gold` · `Family Legacy` · `Modern Editorial`

### `WowConcept`
`conceptName`, `title`, `subtitle`, `creativeExplanation`, `purchasePsychology`,
`heroPhoto`, `supportingPhotos`, `layoutRecipe`, `colorRecipe`, `typographyRecipe`,
`recommendedProduct`, `sharePreview`, `wowScore`, `masterpiecePassed`
(+ additive `scoreBreakdown`, `failureReasons`).

- **`creativeExplanation`** — *why* the AI made its decisions, derived only from the
  profile + brief (Constitution Art. IX — never invents facts).
- **`purchasePsychology`** — gentle guidance ("Best displayed as a framed keepsake."),
  never manipulation.
- **`layoutRecipe` / `colorRecipe` / `typographyRecipe`** — abstract instructions
  (no pixels): the renderer's marching orders.
- **`sharePreview`** — pre-written, in-voice share copy (text only).

---

## The WOW Score (Design Bible Part 7)

100 points across 8 dimensions:
**Hero Strength 15 · Emotional Impact 20 · Storytelling 15 · Layout Balance 15 ·
Typography 10 · Color Harmony 10 · Luxury Finish 10 · Shareability 5.**

**The 90 Rule.** A concept scoring below 90 has `masterpiecePassed: false` and
non-empty `failureReasons`. The pipeline regenerates or discards it — a sub-90 concept
is never revealed.

---

## Determinism

Identical inputs (and `options`) always yield an identical `WOWPresentation`. No
`Date.now()`, no randomness, no I/O — safe to snapshot and cache. Mirrors
`@celebratebanner/memory-profile` and `@celebratebanner/creative-brief`.

---

## Develop

```bash
npm run test        # node --test 'test/*.test.ts'  (91 tests)
npm run typecheck   # tsc --noEmit
npm run fixtures    # regenerate fixtures/*.json from the upstream fixtures
```

Fixtures in `fixtures/` are committed `WOWPresentation` snapshots for
graduation / championship / family / wedding / memorial, used for snapshot-equality tests.

---

## Guardrails

Additive only. This module does **not** modify the renderer, `index.html`,
`server.js`, pricing, checkout, or the upstream engines. It ships as an experimental,
reversible layer; the current builder remains the stable fallback.
