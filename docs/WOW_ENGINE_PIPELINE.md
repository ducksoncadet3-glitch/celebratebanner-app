# CelebrateBanner 2.0 — WOW Engine Pipeline

> **Status:** Draft for review. Planning/documentation only — no code changes authorized yet.
> **Owner:** Duckson Cadet (Founder & CEO), CDN4 LLC (DBA CelebrateBanner)
> **Companions:** [CELEBRATEBANNER_2_0_BLUEPRINT.md](CELEBRATEBANNER_2_0_BLUEPRINT.md) · [CELEBRATEBANNER_DESIGN_BIBLE.md](CELEBRATEBANNER_DESIGN_BIBLE.md)
> **Purpose:** Defines the end-to-end processing pipeline of the **WOW Engine** — how the AI Creative Director turns raw uploaded photos into four art-directed concepts, and how the ≥90 WOW Score gate decides what a customer ever sees. This is the implementation spec for **Blueprint §10 (Immediate Next Technical Task)** and **Sprint 1**.

---

## The Pipeline (canonical flow)

```
Customer uploads photos
          │
          ▼
AI analyzes every photo
          │
          ▼
Creates a Memory Profile
          │
          ▼
Chooses the strongest hero photo
          │
          ▼
Chooses supporting photos
          │
          ▼
Creates four art-directed concepts
          │
          ▼
Scores each concept
          │
          ▼
Only concepts ≥90 are shown
```

Every stage answers the Creative Director Doctrine's four questions: *What story are we telling? What emotion are we creating? Which memory deserves attention? Which photo should become unforgettable?*

---

## Stage 1 — Customer uploads photos

- **Input:** Raw, unsorted photos + the chosen occasion (from Experience Step 1).
- **Framing:** Emotional ("Share your favorite memories") — no slots, no counting anxiety.
- **Behavior:** Accept freely; handle orientation, quality, and quantity invisibly. The customer is never asked to curate.
- **Output:** A photo set + occasion context passed to analysis.

## Stage 2 — AI analyzes every photo

Per-photo assessment (no design decisions yet — just understanding):
- **Technical:** sharpness, exposure, resolution/DPI adequacy for print, noise, orientation (portrait / landscape / square).
- **Content:** faces (count, size, position, expression, eyes-open), subject prominence, background clutter.
- **Emotional signal:** candid vs. posed, joy/pride/tenderness cues, "moment" strength.
- **Craft:** composition quality, crop headroom, whether faces are safely croppable.
- **Output:** a structured per-photo record feeding the Memory Profile.

## Stage 3 — Creates a Memory Profile

The Memory Profile is the engine's understanding of *this celebration* — the bridge between raw photos and art direction.
- **Story detection:** infer the narrative (a graduate's journey, a championship run, a life remembered, a family across time).
- **Cast:** who/what recurs; the central subject(s).
- **Emotional tone:** the dominant feeling to design toward (pride, triumph, warmth, reverence).
- **Occasion binding:** merge detected story with the chosen occasion's creative context (palette lean, lead concept).
- **Photo pool ranking:** each photo scored for hero-worthiness and supporting value.
- **Output:** a Memory Profile object that all four concepts draw from.

## Stage 4 — Chooses the strongest hero photo

- Selects the single most powerful, well-lit, emotionally strong, safely-croppable photo. **The hero photo is sacred.**
- Prefers a clean subject, good headroom, sharp focus, and print-adequate resolution.
- **Output:** one hero designation (the anchor of every concept).

## Stage 5 — Chooses supporting photos

- Selects only photos that **strengthen the hero and the story**. Weak or redundant photos are cut. **Beauty wins over quantity.**
- Enforces restraint — a small, strong supporting set over a crowded one. Leaving photos out is a valid, encouraged decision.
- **Output:** a ranked supporting set (a concept may use fewer than offered).

## Stage 6 — Creates four art-directed concepts

- Generates the four premium concepts from the same Memory Profile: **Signature Edition, Luxury Gold, Family Legacy, Modern Editorial.**
- Each is a complete, distinct point of view — governed entirely by the Design Bible (layout, typography, lighting, photo treatment, decoration, allowed/forbidden effects).
- **Output:** four finished candidate designs.

## Stage 7 — Scores each concept

- Applies the **100-point WOW Score** (Design Bible Part 7): Hero Strength, Emotional Impact, Storytelling, Layout Balance, Typography, Color Harmony, Luxury Finish, Shareability.
- Scoring is per-concept and independent.
- **Output:** a WOW Score per concept.

## Stage 8 — Only concepts ≥90 are shown

- **Hard gate:** a concept below 90 is **never revealed** — it is regenerated or discarded.
- The reveal presents concepts that independently clear 90. If a concept can't reach 90, the engine generates another rather than lowering the bar.
- **Output:** the cinematic reveal (Experience Step 4) of ≥90 concepts only.

---

## Guarantees & Invariants

- **The hero is sacred** — every concept is anchored by the chosen hero; supporting photos only strengthen it.
- **No filler** — empty space is never filled just because it exists; restraint is intentional.
- **Beauty over quantity** — fewer, stronger photos always beat a crowded design.
- **Never below 90** — the customer never sees a concept that fails the WOW Score.
- **Fallback preserved (prototype phase):** per Blueprint §10, the current renderer remains the fallback; the WOW Engine ships as an additive, experimental, reversible layer and does not remove the existing stable builder flow.

---

## Open Spec Questions (to resolve before build)

These are intentionally unresolved here — flagged so the prototype can decide them explicitly rather than by accident:

1. **Memory Profile schema** — concrete data shape/fields for the per-photo record and profile.
2. **Scoring source** — is the WOW Score model-judged, heuristic, or hybrid? Same model that generates?
3. **Regeneration budget** — how many regenerate attempts before falling back, and what the fallback shows.
4. **Hero tie-breaking** — rules when multiple photos score equally hero-worthy.
5. **Minimum viable photo set** — behavior when the customer uploads too few or all-low-quality photos.
6. **Latency target** — the processing experience (Step 3) must feel cinematic but bounded; define the time budget.
7. **Where compute runs** — client-side vs. `api.celebratebanner.com`; how it coexists with the current renderer fallback.

---

## Guardrails for This Planning Phase

Documentation only. Until explicitly approved and directed:
- Do **not** modify `index.html`.
- Do **not** modify `server.js`.
- Do **not** modify pricing, rendering, or app behavior.
- Do **not** commit.
- Do **not** push.
