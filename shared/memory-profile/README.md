# @celebratebanner/memory-profile

The **AI Creative Director's analysis stage** — Sprint 1 of the WOW Engine.

It transforms uploaded photos into a structured **Memory Profile**: the single
source of truth for every downstream system (concept generation, WOW scoring,
renderers).

> **No renderer inspects raw photos directly.** Everything consumes the
> `MemoryProfile`.

## Public API — one function

```ts
import { generateMemoryProfile } from '@celebratebanner/memory-profile';

const profile = generateMemoryProfile(uploadedPhotos, { occasion: 'graduation' });
```

- **Input:** `PhotoInput[]` — normalized photo descriptors (`id`, `width`,
  `height`, plus optional analysis signals: `faceCount`, `sharpness`,
  `brightness`, `contrast`, `dominantColors`, `takenAt`, `perceptualHash`,
  `isMonochrome`).
- **Options:** `{ occasion?: OccasionType }` — the occasion chosen in Step 1.
- **Output:** one `MemoryProfile` object (see
  [`docs/MEMORY_PROFILE_SCHEMA.md`](../../docs/MEMORY_PROFILE_SCHEMA.md)).

## What it does

- detects the occasion (explicit → filename hint → `unknown`)
- ranks every photo (technical quality + emotional value)
- chooses the sacred **hero** photo
- selects **supporting** photos (drops weak + duplicate photos — *beauty over
  quantity*)
- estimates dominant colors, mood, and story
- flags **duplicate** and **restoration** candidates
- recommends one of the four concepts: **Signature Edition · Luxury Gold ·
  Family Legacy · Modern Editorial**

It reads **no pixels**. Callers supply analysis signals (EXIF, a canvas sampler,
or a future vision stage). Missing signals degrade gracefully into `warnings`
and a lower `confidence_score`.

## Determinism

Identical input → identical output. No `Date.now()`, no randomness, no I/O.
Profiles are safe to snapshot and cache (mirrors `@celebratebanner/render-engine`).

## Design constraints

- **Additive.** Ships alongside the current renderer; changes nothing that
  exists. The current builder flow remains the fallback (Blueprint §10).
- **No build step required.** Source runs directly in TypeScript-aware runtimes
  (the `web/` Next.js bundler, or Node ≥22 via type-stripping).

## Develop

```bash
cd shared/memory-profile
node --test test/     # run unit tests + fixture snapshots (no deps needed)
npx tsc --noEmit      # typecheck (requires the devDependency)
```

## Authority

Implements the specs — it does not invent them:
[Blueprint](../../docs/CELEBRATEBANNER_2_0_BLUEPRINT.md) ·
[Design Bible](../../docs/CELEBRATEBANNER_DESIGN_BIBLE.md) ·
[WOW Engine Pipeline](../../docs/WOW_ENGINE_PIPELINE.md) ·
[Memory Profile Schema](../../docs/MEMORY_PROFILE_SCHEMA.md)
