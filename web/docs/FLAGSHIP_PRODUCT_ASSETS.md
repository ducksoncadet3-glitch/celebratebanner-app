# Flagship Product Assets

How to supply and install the seven approved flagship product mockups. Until real files are
added, the storefront stays on the generated on-brand **SAMPLE DESIGN** placeholders — nothing
visible changes.

## The seven flagship products

| Slug | Aspect | Hero (px) | Thumbnail (px) |
|------|--------|-----------|----------------|
| `team-banner` | landscape | 1600 × 900 | 800 × 450 |
| `senior-night-banner` | landscape | 1600 × 900 | 800 × 450 |
| `graduation-banner` | landscape | 1600 × 900 | 800 × 450 |
| `graduation-poster` | portrait | 1200 × 1500 | 640 × 800 |
| `championship-banner` | landscape | 1600 × 900 | 800 × 450 |
| `coach-appreciation-banner` | landscape | 1600 × 900 | 800 × 450 |
| `game-day-graphic` | square | 1200 × 1200 | 800 × 800 |

Aspect is intentionally aligned with each product's existing placeholder aspect
(`banner → landscape`, `poster → portrait`, `social-graphic → square`), so swapping the real
asset in **will not shift the layout**.

## Folder structure

```
web/public/storefront/
├── team-banner/
│   ├── hero.webp
│   └── thumbnail.webp
├── senior-night-banner/
│   ├── hero.webp
│   └── thumbnail.webp
├── graduation-banner/
├── graduation-poster/
├── championship-banner/
├── coach-appreciation-banner/
└── game-day-graphic/
```

Each folder currently contains only a `.gitkeep` (to preserve the empty directory in git).
**Do not commit empty/placeholder binary image files.**

## Naming convention

- Hero image: `hero.webp`
- Thumbnail image: `thumbnail.webp`
- Exact paths are defined in `web/lib/catalog/flagship-assets.ts` (`heroPath` / `thumbnailPath`)
  and resolve to public URLs like `/storefront/team-banner/hero.webp`.

## Preferred format & export guidance (WebP)

- **Format:** WebP (`.webp`), preferred for all approved assets.
- **Quality:** export at ~80–85 quality (lossy). Target < 250 KB for heroes, < 80 KB for thumbnails.
- **Color:** sRGB. Keep the CelebrateBanner obsidian/gold palette; no ICC surprises.
- **Exact pixel dimensions:** match the table above precisely (the resolver sets `width`/`height`
  from the manifest to prevent layout shift).
- Example (cwebp): `cwebp -q 82 -resize 1600 900 hero.png -o hero.webp`
- Example (sharp): `sharp('hero.png').resize(1600, 900).webp({ quality: 82 }).toFile('hero.webp')`

## Quality checklist (every asset must pass)

- [ ] Finished, personalized design with **real photos** — not empty photo slots or silhouettes.
- [ ] Correct exact dimensions and aspect (see table).
- [ ] WebP, sRGB, reasonable file size.
- [ ] No app/browser **UI chrome** (nav, buttons, watermarks, "Unlock My Banner", etc.).
- [ ] No **watermark** or "SAMPLE"/"BEFORE/AFTER" overlays.
- [ ] Legible at thumbnail size.
- [ ] No third-party logos, licensed marks, or real minors' faces without release.
- [ ] Fictional names/teams only (e.g. "Riverside Eagles"), consistent with existing copy.

## Do NOT use

Per the asset audit, the following existing repo images are **not acceptable** as product mockups:

- **Screenshots** of the builder/preview pages (`flow_*_preview.png`, `*_mobile_page.png`).
- **Empty-slot templates** (`team_banner_*_preview.png`, `buy_*`, `team_{sport}.png` — blank photo circles / silhouettes).
- **Raw builder canvases** with placeholder text (`flow_*_canvas.png` — "e.g., Sarah Johnson").
- **Watermarked** or locked previews.
- **UI chrome / design-concept cards** with filename placeholders (`s14_*`, `s15_*` — "grad_portrait.jpg").
- **Internal QA composites** (`cine_ba_*` BEFORE/AFTER, `team-final-approval-board.png`).
- Any **stock photo** or externally hotlinked image.

## Fallback behavior

The resolver (`web/lib/catalog/product-image.ts`, `resolveProductImage(slug, variant)`):

1. Uses the approved asset **only if the file exists** on disk under `web/public`.
2. Otherwise returns the catalog's generated SAMPLE DESIGN placeholder.
3. **Never returns an empty or broken `src`.** The catalog remains the single source of truth.

## Installing approved files (activation)

1. Export each product's `hero.webp` and `thumbnail.webp` at the exact dimensions above.
2. Drop them into the matching `web/public/storefront/<slug>/` folder (replacing nothing — the
   folders are empty except `.gitkeep`).
3. **Wire the resolver** into the render sites (currently NOT wired, so placeholders show):
   at each product-image render (`ProductGrid` / product detail hero), call
   `resolveProductImage(slug, 'thumbnail' | 'hero')` and pass its `src` / `alt` / `width` / `height`
   to the existing `ProductCard` / `<ProductGallery>` — instead of the raw `product.image`.
   Because the resolver falls back to placeholders per-product, you can add files (and flip the
   wiring) one product at a time with zero risk of a broken image.
4. Run `npx tsc --noEmit`, `npx vitest run`, `npx next build`, and visually verify.
