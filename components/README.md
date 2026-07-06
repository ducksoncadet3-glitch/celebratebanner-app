# @celebratebanner/premium-reveal

The **Premium Reveal UI** (CelebrateBanner 2.0, Sprint 4).

Framework-agnostic **vanilla-DOM** components that render a
[`WOWPresentation`](../shared/wow-engine) — the AI Creative Director's four premium
concepts — as a luxury reveal experience.

> **Additive & decoupled.** No build tools, no framework. Every component is a plain
> function that returns an `HTMLElement`, usable from the existing vanilla builder or
> any host. **No pricing, no checkout, and no renderer integration** — previews are
> placeholders. It is not wired into `index.html`.

Governed by the [Creative Constitution](../docs/CREATIVE_CONSTITUTION.md) and
[Design Bible](../docs/CELEBRATEBANNER_DESIGN_BIBLE.md); realizes the
[WOW Engine Specification](../docs/WOW_ENGINE_SPECIFICATION.md) reveal screen.

---

## Usage

```ts
import { mountPremiumReveal } from '@celebratebanner/premium-reveal';
import { generateWOWPresentation } from '@celebratebanner/wow-engine';

const presentation = generateWOWPresentation(memoryProfile, creativeBrief);

mountPremiumReveal(document.getElementById('reveal')!, {
  presentation,
  handlers: {
    onLove:       (c) => { /* customer chose this concept */ },
    onDetails:    (c) => { /* open details */ },
    onTryAnother: (c) => { /* request a different direction */ },
  },
  // skipLoading: true,        // jump straight to the reveal
  // loadingIntervalMs: 900,   // pace of the six-stage intro
});
```

## Components

| Folder | Export | Renders |
|--------|--------|---------|
| `PremiumReveal/` | `createPremiumReveal`, `mountPremiumReveal` | loading → reveal (title, subtitle, Director's Choice note, gallery) |
| `LoadingSequence/` | `createLoadingSequence` | the six sequential stages (below) |
| `RevealGallery/` | `createRevealGallery` | the four concept cards + arrow-key navigation |
| `ConceptCard/` | `createConceptCard` | preview placeholder, name, score, badge, explanation, product, psychology, 3 actions |
| `DirectorChoice/` | `createDirectorChoice` | the recommended-concept ribbon |
| `MasterpieceBadge/` | `createMasterpieceBadge` | ✨ Masterpiece / In review |
| `WOWScore/` | `createWowScore` | the 0–100 WOW Score badge |

### Loading stages
1. Understanding your celebration
2. Finding your strongest memories
3. Selecting your hero photograph
4. Building your family's story
5. Creating premium concepts
6. Final creative review

### Reveal screen
- **Title:** *Your Masterpieces Are Ready*
- **Subtitle:** *Our AI Creative Director created four unique concepts from your memories.*
- **Director's Choice** highlighted, then four **ConceptCards**, each with a preview
  placeholder, concept name, WOW Score, Masterpiece Badge, creative explanation,
  recommended product, purchase psychology, and buttons **Love This · See Details ·
  Try Another Direction**.

## Design & motion
Luxury editorial — Obsidian / Champagne Gold / Ivory, Cormorant Garamond + Outfit.
Elegant, restrained motion: a **sequential reveal** (staggered card rise) and a gentle
stage pulse. Honors `prefers-reduced-motion`. Styles inject once per document
(`injectStyles`).

## Accessibility
- Loading uses an `aria-live="polite"` status region with `aria-current` on the active step.
- Cards are focusable groups with descriptive `aria-label`s (name + score + state);
  **arrow keys / Home / End** move focus across the gallery.
- Every action is a real `<button type="button">` with an `aria-label`; Director's
  Choice carries `aria-current="true"`; score/badge/ribbon are screen-reader labelled.
- Responsive: two-column gallery collapses to one column on small screens.

## Develop
```bash
npm run test        # node --test 'test/*.test.ts'  (46 tests, jsdom)
npm run typecheck   # tsc --noEmit
```

## Guardrails
Additive only. Does **not** modify the renderer, `index.html`, `server.js`, pricing,
or checkout. Preview placeholders until the renderer is wired in a later sprint.
