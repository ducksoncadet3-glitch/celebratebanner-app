# @celebratebanner/render-engine

Deterministic, environment-agnostic banner rendering engine. Runs in the
browser for previews and in Node (via `canvas` / `skia-canvas`) for HD
print-quality exports.

The engine is **the product moat**. It's intentionally small, pure, and
extensible — no React, no DOM globals, no business logic.

## Pipeline

```
upload images
    ↓
choose arrangement       ── arrangement registry  (5 built-in, extensible)
    ↓
choose frame per photo   ── frame registry        (20 built-in, extensible)
    ↓
renderPreview()          ── 800×1200, ~150ms, browser
    ↓
renderHD()               ── 7200×10800 @ 300 DPI, Node + node-canvas
    ↓
getMockup('retractable-stand').render(target, banner)
    ↓
PNG buffer → S3 → signed download URL → customer
```

## Public API

```ts
import { renderPreview, renderHD, getMockup } from '@celebratebanner/render-engine';

// Browser
renderPreview(htmlCanvas, input);

// Server (Node)
const canvas = createCanvas(7200, 10800);
renderHD(canvas, input);          // input.photos[].image = node-canvas Image
const standMockup = createCanvas(1200, 1800);
getMockup('retractable-stand').render(standMockup, await loadImage(canvas.toBuffer()));
```

## Architecture

```
src/
├── types.ts                  Core types — RenderInput, Photo, Theme, etc.
├── canvas/
│   ├── helpers.ts            drawCover (cover + contain auto-fallback), roundRect, hex/rgba utils, tileToCount
│   ├── paths.ts              hexPath, diamondPath, scallopPath, heartPath, starPath
│   └── rng.ts                mulberry32 seeded PRNG + photoRot helper
├── theme/
│   ├── background.ts         drawBannerBackground — gradient + gold border
│   └── text.ts               renderBannerText — headline placeholder, hero text fields
├── frames/
│   ├── registry.ts           registerFrame() / getFrame() / listFrames()
│   ├── dispatch.ts           drawPhotoFramed (per-photo dispatch), drawHero3D (cinematic), drawPhoto3D (scattered)
│   ├── rounded.ts            Rounded
│   ├── shapes.ts             Circle, Hexagon, Diamond, Scallop, Heart, Star
│   ├── cards.ts              Polaroid, Vintage, Washi tape, White edge
│   ├── borders.ts            Gold edge, Double gold, Baroque, Ribbon, Crown
│   ├── effects.ts            Neon glow, Glitter, Drop shadow, Shadow box
│   └── index.ts              Side-effect imports all 20 frames, re-exports registry API
├── arrangements/
│   ├── registry.ts
│   ├── classic.ts            Hero centered top, 8×5 grid below
│   ├── magazine.ts           Hero left, 2-col right grid + 3-col bottom grid
│   ├── pyramid.ts            Hero top, widening rows (2,3,4,5,…)
│   ├── scattered.ts          Scrapbook — rotated cards around a center hero
│   ├── mosaic.ts             Hero center, top row + side columns + bottom band
│   └── index.ts              Side-effect imports + registry API
├── mockups/
│   ├── registry.ts
│   ├── retractable-stand.ts  Realistic chrome banner stand
│   └── index.ts
└── pipeline/
    ├── render.ts             renderBanner — composes bg + text + arrangement
    ├── preview.ts            renderPreview — 800×1200 browser path
    ├── export.ts             renderHD — 300 DPI server path
    └── index.ts
```

## Determinism

Same `RenderInput` → identical pixels in every environment. This is critical
because the preview the user sees in the browser must match the HD file they
download. The `seed` field on `RenderInput` controls all jitter / scrapbook
rotation — change the seed if you want a different shuffle.

## Performance characteristics

| Surface             | Resolution     | Target time | Notes                                   |
| ------------------- | -------------- | ----------- | --------------------------------------- |
| `renderPreview`     | 800 × 1200     | < 200 ms    | 50 photos, mid-tier laptop              |
| `renderHD` 24×36"   | 7200 × 10800   | 2–4 s       | node-canvas, server-side                |
| stand mockup        | 1200 × 1800    | < 100 ms    | runs after HD render completes          |

## Extending

```ts
import { registerFrame, registerArrangement } from '@celebratebanner/render-engine';

registerFrame({
  id: 'paper-tear',
  label: 'Torn paper',
  draw(ctx, img, x, y, w, h, withShadow) { /* ... */ },
});

registerArrangement({
  id: 'memorial',
  label: 'Memorial',
  minPhotos: 1,
  maxPhotos: 30,
  render(env, photos) { /* ... */ },
});
```

Themes (`graduation`, `wedding`, `champion`, `pets`, `anniversary`,
`milestone`, …) are pure data — pass any `Theme` into `RenderInput.theme`.
No registration needed; the engine doesn't care which themes exist.

## Roadmap

- [ ] Memorial template pack
- [ ] Sports league templates (Champions update — multi-team logos)
- [ ] MP4 slideshow encoder (server-only) — feeds the same `RenderInput`
      through a frame-by-frame Ken Burns animator
- [ ] WebGPU preview path for 50-photo banners on mobile
- [ ] Locale-aware text (Haitian Flag Day theme — bilingual)
