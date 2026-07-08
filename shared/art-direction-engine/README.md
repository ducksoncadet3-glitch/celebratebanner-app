# @celebratebanner/art-direction-engine

The AI Art Director. CelebrateBanner should not feel like a template engine — it should
feel like a professional creative agency. This engine is what makes that true.

## 1. Purpose

The WOW Engine chooses **which four concepts** to show. The Render Orchestrator translates
a concept into **renderer instructions**. Between them there was nothing deciding *how each
concept should actually look* — so all four came out as variations of one template.

The Art Direction Engine fills that gap. It takes the four approved concepts and gives each
one a genuinely distinct **artistic identity**, then re-writes that concept's creative
recipes (palette, hero emphasis, whitespace, supporting rhythm, typography, photo order) so
the **untouched** Render Orchestrator carries the direction downstream.

> The Art Director **decides**. The renderer **executes**.

## 2. Pipeline position

```
Memory Profile
  → Creative Brief
    → WOW Engine
      → Art Direction Engine        ← this module
        → Render Orchestrator
          → Render Adapter
            → Renderer
              → Premium Reveal
```

It reads the profile, the brief and the presentation; it writes a new presentation plus a
per-concept `ArtDirection`. Nothing downstream had to change to accommodate it.

## 3. Responsibilities

The Art Director decides all ten:

| Decision | Shape |
|---|---|
| **composition philosophy** | `philosophy.thesis`, `balance` |
| **visual hierarchy** | `philosophy.visualHierarchy` — what the eye meets, in order |
| **whitespace strategy** | `whitespace.level`, `marginRatio`, `gutterRatio` |
| **hero emphasis** | `hero.dominanceRatio` — always **55–70%** — plus framing, spotlight, frame |
| **supporting-photo rhythm** | `supporting.count`, `cadence`, `aspect`, `gapRatio` |
| **typography hierarchy** | `typography.displayScale`, `tracking`, `casing`, `alignment` |
| **luxury level** | `luxuryLevel` (0–100) |
| **emotional intensity** | `emotionalIntensity` (0–100) |
| **framing style** | `framingStyle`: museum · cinematic · intimate · editorial |
| **storytelling flow** | `storytellingFlow` — the narrative beat of every supporting photo |

It also emits a `RenderTreatment` (grade, vignette, hero frame, supporting aspect, cinematic
hero) that the render binding executes, and `copy` (title, **one** emotional sentence,
**three** premium bullets) that the concept card displays.

## 4. Concept identities

Four briefs, not four presets. Every row below differs — asserted by the uniqueness tests.

**Signature Edition** — *a luxury museum print.* Symmetrical, elegant, restrained. Large
centred hero (**69%**), generous gallery margins, four evenly weighted supporting frames.
Obsidian ground, champagne gold used sparingly, ivory type. Quiet confidence.

**Luxury Gold** — *high-end editorial.* Fashion-magazine drama: a **spotlit** hero (**67%**),
tight dramatic margins, oversized display caps, and only **three** supporting frames —
scarcity is what reads as expensive. Near-black ground, bright gold at full voice, the
highest contrast grade of the four.

**Family Legacy** — *emotional storytelling.* A layered photo journey, family first. The
hero anchors (**59%**) but does not dominate; **six** memories run in narrative order.
Warm brown-black ground, amber accent, cream type — the palette of a family album. The most
emotionally intense identity.

**Modern Editorial** — *a magazine cover.* Asymmetric, off-centre hero (**63%**), expansive
negative space, a large left-aligned headline, three generously spaced frames. Cool ink
ground with **ivory as the accent** — light is the accent, not gold. The most desaturated,
most contemporary grade.

## 5. Public API

```ts
directArt(
  memoryProfile: MemoryProfile,
  creativeBrief: CreativeBrief,
  wowPresentation: WowPresentation,
  options?: { beats?: string[] },
): ArtDirectionResult
```

Returns:

```ts
{
  schemaVersion: string,
  occasion: string,
  directions: ArtDirection[],      // one per concept: philosophy, hero, palette, copy, treatment, story
  presentation: WowPresentation,   // the SAME four concepts, re-recipe'd by the art director
}
```

Helpers: `directionByName(result, conceptName)`, `orderPhotoStory(photos, occasion)`,
`classifyPhoto`, `heroEmphasisFor`, `clampHeroDominance`, `copyFor` / `bulletsFor`.

Typical use (see `components/demo/pipeline.ts`):

```ts
const brief = generateCreativeBrief(profile);
const raw = generateWOWPresentation(profile, brief);
const artDirection = directArt(profile, brief, raw);
const plan = generateRenderPlan(profile, brief, artDirection.presentation); // orchestrator unchanged
```

### Storytelling flow

Supporting photos are ordered into the occasion's narrative arc — a graduation reads
**portrait → diploma → parents → friends → celebration → cake**. Photos are classified from
filename cues, then face count as a fallback. Arcs exist for graduation, championship,
wedding, family reunion and memorial; anything else uses a sensible default.

## 6. Design guardrails

- **Never invent people.** Copy states design facts (composition, hero percentage, palette,
  story length) or occasion-appropriate sentiment. It never names anyone, never claims a
  relationship, never asserts something the Memory Profile did not say.
- **Never drop photos.** Reordering is not deletion. `supporting.count` decides how many are
  *drawn*; every supporting photo stays in the presentation.
- **Never reorder silently.** Each photo's beat carries a recorded `reason` — the Creative
  Constitution forbids moving a memory without justification.
- **Never mutate inputs.** The profile, brief and presentation are deep-cloned; callers get a
  new presentation and keep their originals intact.
- **Never re-score.** `wowScore`, `masterpiecePassed` and the hero photo pass through
  untouched — quality is the WOW Engine's verdict, not the art director's.
- **Never override checkout or pricing.** This module has no knowledge of either.
- **Never touch renderer algorithms.** `render-engine`, `render-orchestrator` and
  `render-adapter` are read-only dependencies. Direction reaches the renderer only through
  recipes and the `RenderTreatment` the binding executes.

Hero dominance is always clamped into **55–70%** (`clampHeroDominance`), and `hero.fillsFrame`
is always `true` — dead space is forbidden.

> **Known boundary.** The renderer's arrangement geometry (the literal hero box) is fixed and
> off-limits, so hero dominance is enforced as a *decision* and expressed through the levers we
> do control: cinematic framing, spotlight, gold frame, fewer competing supporting frames, and
> the image-intelligence pre-crop that guarantees the hero fills its box. Likewise the raster
> headline font stack lives in the renderer; typography hierarchy is fully realised in the
> concept card and carried downstream as recipe guidance.

## 7. Testing

`test/artDirection.test.ts` — **69 tests**, deterministic, no network, no pixels:

- **Engine shape** across all five fixtures: four directions, full brief on each, deterministic
  output, scores and hero photo passed through, no supporting photo dropped or invented.
- **Concept uniqueness** — the heart of the sprint. Pairwise-distinct assertions on philosophy,
  balance, visual hierarchy, palette, hero frame + framing style, whitespace level, render
  treatment (grade + vignette), luxury level, emotional intensity, hero dominance, cadence and
  card copy. All must be **4/4 distinct**.
- **Identity fidelity** — Luxury Gold is the highest luxury *and* highest contrast; Family
  Legacy is the most emotional and shows the most photos; Modern Editorial is the most
  desaturated and most expansive; Signature Edition is symmetrical and unspotlit.
- **Hero dominance** — every concept, every fixture, inside 55–70%; a wildly out-of-range brief
  is clamped, never escapes the band.
- **Storytelling ordering** — the full graduation arc, stability of unclassified photos, no
  photo dropped, a `reason` on every beat, and `cap_toss` reading as *celebration* not *portrait*.
- **Card copy** — exactly one sentence and three bullets, distinct per concept, real hero
  percentage quoted, and **no internal status words** (`FALLBACK` / `RENDERED` / `IN REVIEW`).
- **No production regression** — git guards asserting `render-engine`, `render-orchestrator`,
  `render-adapter` and `index.html` are untouched.

```bash
npm test        # node --test 'test/*.test.ts'  (69 tests)
npm run typecheck
```
