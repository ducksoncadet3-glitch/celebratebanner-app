# @celebratebanner/creative-brief

The **AI Creative Director's direction stage** — Sprint 2 of the WOW Engine.

The **Memory Profile** tells us *what the photos contain*.
The **Creative Brief** decides *how the celebration story should be told*.

It is the bridge in the pipeline:

```
Memory Profile → Creative Brief → Four Premium Concepts → WOW Score → Reveal UI
```

## Public API — one function

```ts
import { generateCreativeBrief } from '@celebratebanner/creative-brief';

const brief = generateCreativeBrief(memoryProfile);
// optional deterministic timestamp:
// const brief = generateCreativeBrief(memoryProfile, { now: '2026-07-05T00:00:00Z' });
```

- **Input:** a `MemoryProfile` (from `@celebratebanner/memory-profile`). Consumed
  **read-only** — never mutated.
- **Options:** `{ now?: string | null }` — stamps `createdAt`; omit to stay
  deterministic (`createdAt: null`).
- **Output:** one `CreativeBrief` object (see
  [`docs/CREATIVE_BRIEF_SCHEMA.md`](../../docs/CREATIVE_BRIEF_SCHEMA.md)).

## What it decides

- the lead **concept** (Signature Edition · Luxury Gold · Family Legacy · Modern Editorial)
- **emotional direction** and **story angle** (occasion-driven)
- **primary / secondary message** templates
- **hero strategy** (why the hero is strongest, how dominant, how supporting serves it)
- **supporting hierarchy** (emotional anchors → story builders → accents)
- **color, typography, composition, decorative** direction (Design Bible)
- **product / audience intent**, **personalization** prompts, **upsell** opportunities
- **WOW targets** (≥90 gate + emphasis)
- **risk warnings** (too few photos, weak hero, low confidence, duplicate-heavy,
  restoration-needed, mixed-orientation conflict, overcrowding risk)

## Determinism

Identical input (and `options`) → identical output. No `Date.now()`, no
randomness, no I/O. Mirrors `@celebratebanner/memory-profile`.

## Design constraints

- **Additive.** Not wired into `index.html`; changes nothing that exists.
- **No pricing.** `productIntent` / `upsellOpportunities` are descriptive only.
- **No build step required.** Runs in TypeScript-aware runtimes (the `web/`
  Next.js bundler, or Node ≥22 via type-stripping).

## Develop

```bash
cd shared/creative-brief
node --test 'test/*.test.ts'   # unit tests + fixture snapshots (no deps)
npx tsc --noEmit               # typecheck (requires devDependencies)
```

## Authority

Implements the specs — it does not invent them:
[Blueprint](../../docs/CELEBRATEBANNER_2_0_BLUEPRINT.md) ·
[Design Bible](../../docs/CELEBRATEBANNER_DESIGN_BIBLE.md) ·
[WOW Engine Pipeline](../../docs/WOW_ENGINE_PIPELINE.md) ·
[Memory Profile Schema](../../docs/MEMORY_PROFILE_SCHEMA.md) ·
[Creative Brief Schema](../../docs/CREATIVE_BRIEF_SCHEMA.md)
