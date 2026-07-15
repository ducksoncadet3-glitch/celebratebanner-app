# AI Art Director — CelebrateBanner 3.0 (Architecture Only)

> **Milestone status: ARCHITECTURE ONLY.** This module contains **no production
> generation code and calls no external AI APIs.** It is a self-contained design
> foundation for an AI-driven premium-artwork pipeline that will *eventually*
> sit alongside — and later replace — the current browser (canvas) renderer.
>
> The existing application is **fully functional and untouched.** Everything the
> customer uses today (the Premium Cinematic browser renderer, checkout, Stripe,
> concierge capture, the marketing site, and all existing products) is treated as
> **read-only** and is not imported, modified, or depended upon by this module.

## What this is

An **independent service** that turns a customer's photos + product details into a
finished, review-approved, print-ready premium banner using AI generation —
governed by a **Gold Standard** (the visual DNA) and a per-product **Adapter**
(the content), so every product (Graduation, Team, Wedding, Family Legacy,
Memorial, Patriotic, and future products) shares one art-directed design language.

It is designed to **coexist** with the current renderer behind a feature flag and
to **fall back** to the existing browser renderer on any failure — so adoption is
safe, gradual, and reversible.

## Supported products (design targets)

Graduation · Team Sports · Wedding · Family Legacy · Memorial · Patriotic · *future products.*
New products are added by dropping in a new **adapter** — no pipeline changes.

## Folder structure

```
ai-art-director/
├── README.md                  ← this file
├── package.json               ← module boundary (scaffold; no runtime deps yet)
├── docs/                      ← the 10 architecture deliverables
│   ├── ARCHITECTURE.md            (2) components + responsibilities + coexistence
│   ├── DATA_FLOW.md               (3) request → output diagrams (mermaid)
│   ├── PROMPT_STRATEGY.md         (4) layered, versioned prompt building
│   ├── GOLD_STANDARD_SPEC.md      (5) the visual-DNA specification
│   ├── ADAPTER_SPEC.md            (6) per-product content contract
│   ├── REVIEW_WORKFLOW.md         (7) QA gates + human review before any customer sees art
│   ├── VERSIONING.md              (8) reproducibility + migration
│   ├── API_INTERFACES.md          (9) REST + queue + typed contracts
│   └── ERROR_HANDLING.md          (10) retries, DLQ, circuit breaker, renderer fallback
├── prompts/         ← prompt templates (data, not code) + fragments
│   └── templates/
├── gold-standards/  ← visual-DNA definitions (versioned JSON) + JSON Schema
│   └── premium-cinematic-landscape/
├── adapters/        ← per-product content packs (versioned JSON) + JSON Schema
│   ├── graduation/
│   └── team/
├── generators/      ← pluggable generator boundary (typed contracts; NO impl)
├── assets/          ← fonts, decorative overlays, textures, reference imagery
├── queues/          ← job/message schemas for the async pipeline (typed contracts)
├── outputs/         ← generated artifacts land here at runtime (git-ignored)
├── review/          ← review records + state machine (schema)
└── services/        ← service boundaries (typed contracts; NO impl)
```

Every folder has its own `README.md` explaining what belongs there and what must
never go there.

## Hard boundaries (non-negotiable)

- **Read-only to production.** This module never imports from or writes to
  `index.html`, `graduation-*.html`, `team-cinematic*.html`, `concierge/`,
  `design-references/` (the live renderer specs), Stripe links, or the marketing repo.
- **No AI calls in this milestone.** No API keys, no network calls, no SDKs wired.
- **No generation code.** `*.ts` files here are **type/interface contracts only**
  (no runtime logic, no function bodies that execute work).
- **Additive & reversible.** Nothing here changes the customer's current experience.

## How it will eventually relate to the current renderer

```
                       ┌─────────────────────────────┐
   customer order ────▶│  render mode selector (flag)│
                       └───────┬──────────────┬──────┘
                     "browser" │              │ "ai" (opt-in, later)
                               ▼              ▼
             existing Premium Cinematic   AI Art Director pipeline
                canvas renderer (LIVE)      (this module, future)
                               │              │
                               └──────┬───────┘
                                      ▼
                          same 24×18" / 300 DPI print target
```

Until the AI path is proven and approved, `browser` remains the default and only
customer path. The AI path is opt-in, human-reviewed, and always has the browser
renderer as its fallback.
