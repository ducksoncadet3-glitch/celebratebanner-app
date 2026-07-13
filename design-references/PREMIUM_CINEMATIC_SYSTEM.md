# Premium Cinematic — Reusable Product System

CelebrateBanner's **Premium Cinematic** design language is a single, art-directed
landscape composition (black + gold, dominant hero cutout, dual photo collage,
symbolic decorations, five-value footer). It is **product-agnostic**: the same
renderer produces a graduation banner, a team banner, a wedding banner, etc. — only
the *content* changes, never the composition.

## Two layers

| Layer | File(s) | Owns |
|-------|---------|------|
| **A. Gold Standard (generic)** | `gold-standards/premium-cinematic-landscape-v1.{png,json}` + the generic renderer in the product page | Canvas & print dimensions, hero dominance, left/right collage geometry, lighting, particles, vignette, photo framing, typography hierarchy (positions/sizes), footer geometry, shadow / rim-light / glow / spacing / z-index rules |
| **B. Product adapter (specific)** | `products/<name>.json` + a `PRODUCT` config in the page | Product name, wording, badge/quote defaults, color accents, decorative assets, footer values, customer input fields, photo-slot meanings |

The reference image represents the **design language**, not graduation specifically.

## How the renderer is split (in the product page)

```
GENERIC RENDERER  (reused verbatim)          PRODUCT CONFIG  (swapped per product)
──────────────────────────────────          ─────────────────────────────────────
GOLD_STANDARD = { format, slots,            PRODUCT = { id, name,
   bg{glow,particles,vignette},                wording{congratulations,headline,
   footer{band,xStart,xEnd} }                     classLabel,tagline,proud},
renderScene(ctx,W,H):                          defaults{name,year,quote,keepsake},
   • background + glow + particles + vignette  decorations[{type,phase,x,y,w,h}],
   • collage (GOLD_STANDARD.slots)             footerIcons[{icon,top,bottom}] }
   • drawDecor('background')  ◄────────────────┘  (product-supplied)
   • hero cutout (rim/glow/shadow)          DECOR = { <type>: (ctx,W,H,d)=>… }
   • title/quote/name/keepsake  (wording ◄──── PRODUCT.wording / PRODUCT.defaults)
   • drawDecor('title'), drawDecor('topright')
   • footer band + PRODUCT.footerIcons
```

`renderScene` and the low-level primitives (background, lighting, hero cutout,
memory photos, text placement, footer band) never change between products. A product
supplies its `PRODUCT` config and, if it needs new decorations, registers renderers
in the `DECOR` interface (keyed by `type`, drawn in the `background` / `title` /
`topright` phases at fixed z-index).

## Building a future product (adapter recipe)

Create `products/<product>-cinematic-v1.json` and a matching `PRODUCT` block that
supplies **only**:

1. **product name** — e.g. "Cinematic Team Banner"
2. **headline** — the large condensed word (e.g. `CHAMPIONS`, `SENIOR`, `FOREVER`)
3. **subheadline / tagline** — the small caps line under the year/title
4. **badge** — the top-right crest text + any product shield
5. **quote** — default top-right quotation
6. **color accents** — if the product deviates from black/gold (optional)
7. **decorative assets** — the `decorations[]` list + `DECOR` renderers (e.g. a
   trophy instead of a diploma; rings instead of a cap)
8. **footer values** — five `{icon, top, bottom}` entries
9. **input fields** — the customer form fields and their roles
10. **photo-slot meanings** — labels for hero + 3 left + 4 right

Everything else (geometry, lighting, hero dominance, collage positions, footer
layout) is inherited from the Gold Standard unchanged.

## Example adapter names (not built yet)

- `team-cinematic-v1`
- `senior-night-cinematic-v1`
- `championship-cinematic-v1`
- `wedding-cinematic-v1`
- `anniversary-cinematic-v1`
- `memorial-cinematic-v1`

> These are **names only** — placeholders showing the naming convention. No such
> products exist yet; do not build them until commissioned.

## Reference implementation

`graduation-cinematic-v1` (page: `graduation-cinematic.html`,
adapter: `products/graduation-cinematic-v1.json`) is the first product built on this
system and the canonical example of an adapter.
