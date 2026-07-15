# Gold Standard Specification

**Deliverable #5.** The **visual DNA** every product inherits. A Gold Standard is a
versioned, product-agnostic definition of *how a CelebrateBanner keepsake looks*:
composition, lighting, palette rules, hierarchy, atmosphere, and print spec. It
contains **no product wording** — that belongs to Adapters.

## 1. What a Gold Standard is (and is not)

| It IS | It is NOT |
|-------|-----------|
| Composition grid & hero placement (fractions) | Any specific headline or footer text |
| Lighting / shadow / glow / rim-light rules | Any sport, school, or occasion |
| Palette *rules* (roles, contrast floors, CMYK-safe) | A fixed set of literal colors |
| Photo-slot geometry & importance model | Which photo goes where for an order |
| Atmosphere (haze, bloom, particles, vignette) | Customer inputs |
| Print contract (size, DPI, bleed, safe area) | — |
| A reference image + machine-readable JSON | Runtime code |

It mirrors the existing `design-references/gold-standards/premium-cinematic-landscape-v1`
concept, re-expressed as a pipeline contract.

## 2. Structure (fraction-based, resolution-independent)

All geometry is expressed as fractions of the canvas so it scales to any W×H
(preview, 7200×5400 print, etc.) — the same approach the live renderer already uses.

```jsonc
{
  "id": "premium-cinematic-landscape",
  "version": "1.0.0",
  "orientation": "landscape",
  "print": {
    "widthIn": 24, "heightIn": 18, "dpi": 300,
    "bleedIn": 0.125, "safeMarginIn": 0.25,
    "colorMode": "CMYK", "formats": ["pdf", "jpg"]
  },
  "canvas": { "aspect": 1.3333, "referencePx": [7200, 5400] },
  "composition": {
    "hero":  { "cx": 0.30, "cy": 0.52, "w": 0.34, "h": 0.72, "anchor": "bottom" },
    "name":  { "cx": 0.30, "baseline": 0.70, "maxWidthFrac": 0.40 },
    "slots": [
      { "id": "s1", "cx": 0.66, "cy": 0.30, "w": 0.26, "h": 0.30, "importance": "primary" },
      { "id": "s2", "cx": 0.86, "cy": 0.34, "w": 0.20, "h": 0.24, "importance": "secondary" }
      /* … deterministic collage; importance drives lighting/keyline strength … */
    ],
    "footer": { "cy": 0.93, "iconCount": 5 }
  },
  "lighting": {
    "spotlight":   { "on": true, "warmth": "gold", "intensity": 0.22 },
    "rimLight":    { "passes": 2, "softBlurFrac": 0.05 },
    "grounding":   { "contactShadow": true, "castShadow": true },
    "importanceModel": "large slots get top-light + gold keyline; small slots get dark veil"
  },
  "palette": {
    "roles": ["primary", "secondary", "accent", "ink", "paper"],
    "rules": { "contrastFloor": 4.5, "cmykSafe": true, "goldAccent": "#C9A84C" },
    "note": "literal colors come from the Adapter/customer within these rules"
  },
  "atmosphere": {
    "haze": true, "goldBloom": true, "lightRays": "subtle",
    "particles": [{ "count": 46, "tone": "gold", "blend": "lighter" }],
    "vignette": 0.78
  },
  "typography": {
    "display": "Cormorant Garamond",
    "ui": "Outfit",
    "nameScrim": true, "nameShadow": { "alpha": 0.78 }
  },
  "styleConstitution": "cinematic, editorial, luxury keepsake; refined, not busy; emotion first",
  "compositionContract": "single clear hero; supporting memories in ordered collage; generous negative space; balanced gold accents",
  "printContract": "24x18in @ 300dpi, 0.125in bleed, 0.25in safe margin, CMYK-safe palette, no critical content in bleed"
}
```

The paired `*.png` is the human reference (the approved look). The JSON is what the
pipeline reads. Both are versioned together.

## 3. Rules

1. **Product-agnostic.** No wording, occasion, or brand names. If it says "Champions"
   or "Class of 2026", it belongs in an Adapter, not here.
2. **Fraction-based geometry.** No absolute pixels except `referencePx` (advisory).
3. **Palette by role, not literal.** Adapters/customers pick colors *within* the rules.
4. **Print contract is non-negotiable** and matches the app spec (24×18 / 300 DPI /
   bleed 0.125 / safe 0.25 / CMYK / PDF+JPG).
5. **Reference image required.** A gold standard without an approved reference PNG is
   not valid.
6. **Immutable once published.** Changes ship as a new version (see `VERSIONING.md`).

## 4. Validation (schema)

Each gold standard validates against
`gold-standards/premium-cinematic-landscape/schema.json`. The instance
`.../v1.json` is the first published DNA. Adapters bind to it by `{id, version}`.
