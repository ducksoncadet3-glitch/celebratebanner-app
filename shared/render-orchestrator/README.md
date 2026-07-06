# @celebratebanner/render-orchestrator

The bridge between the **WOW Engine** and the **renderer**:

```
Memory Profile → Creative Brief → WOW Engine → ▶ Render Orchestrator ◀ → Renderer → Premium Reveal
```

The WOW Engine **decides** the creative direction. The orchestrator **translates**
that decision into a renderer-ready **`RenderPlan`** — placement, palette, spacing,
layering, export targets, and quality checks. The renderer then **executes** it.

> **The orchestrator makes NO creative decisions and produces NO pixels.** Every value
> is derived from the concept / brief / profile it is handed. Deterministic,
> dependency-free, additive — it does not modify the existing renderer, `index.html`,
> `server.js`, pricing, or checkout.

---

## Public API — one function

```ts
import { generateRenderPlan } from '@celebratebanner/render-orchestrator';

const plan = generateRenderPlan(memoryProfile, creativeBrief, wowPresentation, options?);
// options?: { conceptName?: WowConceptName; now?: string | null }
//   conceptName — which concept to plan for (default: presentation.recommendedConcept)
//   now         — stamps createdAt; omit to stay deterministic (null)
```

Inputs are the real upstream schemas — [`MemoryProfile`](../memory-profile),
[`CreativeBrief`](../creative-brief), and [`WowPresentation`](../wow-engine) — consumed
read-only, never mutated.

---

## `RenderPlan`

| Field | Notes |
|-------|-------|
| `schemaVersion` / `version` / `createdAt` | meta (`createdAt` null unless `options.now`) |
| `occasion`, `conceptName` | the celebration + the concept planned |
| `accepted` | mirror of `qualityChecks.passed` — **check this before rendering** |
| `heroPhoto`, `supportingPhotos` | carried from the WOW concept (metadata only) |
| `layoutRecipe`, `colorRecipe`, `typographyRecipe` | carried from the concept |
| `renderInstructions` | the renderer's marching orders (below) |
| `exportTargets` | the four output specs (below) |
| `qualityChecks` | the quality gate result + reasons |

### `renderInstructions` (WHAT the renderer draws)
`arrangement` · `heroPlacement` (zone, dominanceRatio, frame, spotlight, protectFace) ·
`supportingPlacement` (arrangement, maxCells, count, gapRatio, treatment) ·
`typographyPlacement` (zones, alignment, fonts, treatments) ·
`backgroundSelection` (style, decorationTheme, vignette) ·
`colorPalette` (ground/accent/neutral/palette/source) · `decorativeElements` (from the
brief allowlist) · `spacing` (marginRatio/gapRatio/whitespace) · `layering` (bottom→top order).

Concept → arrangement (the renderer's real vocabulary): **Signature Edition → classic ·
Luxury Gold → pyramid · Family Legacy → mosaic · Modern Editorial → magazine.**

### `exportTargets` (specs only — no pixels)
Four targets, all 300 DPI with 0.125" bleed + 0.25" safe margin:
- **Digital Download** — 24×36 master, RGB, jpg + pdf.
- **18×24 Poster** — CMYK.
- **24×36 Poster** — CMYK.
- **Framed Edition** — 24×36 CMYK, `framed` + `matte`.

---

## Quality gate

A plan is **accepted** only when **every** check passes; otherwise `accepted: false`
with `qualityChecks.reasons`:
hero exists · supporting photos exist · WOW score ≥ 90 · masterpiece passed ·
layout recipe complete · typography recipe complete · export targets defined.

---

## Determinism

Identical inputs (and `options`) always yield an identical `RenderPlan`. No
`Date.now()`, no randomness, no I/O. Snapshots live in `fixtures/`.

## Develop

```bash
npm run test        # node --test 'test/*.test.ts'  (73 tests)
npm run typecheck   # tsc --noEmit
npm run fixtures    # regenerate fixtures/*.json
```

## Guardrails

Additive only. Does **not** modify the renderer, `index.html`, `server.js`, pricing, or
checkout. The current builder remains the stable fallback.
