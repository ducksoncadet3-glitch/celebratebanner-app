# CelebrateBanner 2.0 — WOW Engine Specification

**The complete customer-facing WOW experience.**
Planning document · Sprint 3 · Version 0.1 (draft for review)

> This is the *front-of-house* companion to the [WOW Engine Pipeline](WOW_ENGINE_PIPELINE.md).
> The Pipeline defines how a masterpiece is **manufactured** (8 stages, behind the curtain).
> This Specification defines how the masterpiece is **experienced** — everything the customer
> sees, feels, and does, from the moment they upload to the moment they say *"WOW."*
>
> **Authority:** This document serves — and never overrides — the
> [Creative Constitution](CREATIVE_CONSTITUTION.md) and the
> [Design Bible](CELEBRATEBANNER_DESIGN_BIBLE.md). Where this spec and those conflict, they win.

---

## Guardrails (planning phase)

Documentation only. This document proposes; it does not build. Until explicitly approved:
do **not** modify `index.html`, `server.js`, the renderer, pricing, or app behavior; do **not**
commit or push. The current stable builder remains the fallback (Blueprint §10); the WOW
Engine ships as an additive, reversible layer.

---

## North Star

> The entire experience exists to earn one involuntary reaction:
> **"I can't believe this came from our photos."** *(Creative Constitution — The Promise)*

Everything below is instrumentation toward that single moment — the **First WOW** — delivered
as fast as trust allows and as beautifully as the Constitution demands.

---

## 1. The Emotional Journey — Upload to Reveal

The customer travels a deliberate emotional arc. Each phase has a *job* (what the customer
should feel) and a *rule* (what we must never do).

| Phase | Customer feels | Our job | Never |
|-------|----------------|---------|-------|
| **1. Invitation** | "This will be easy." | One warm ask: *upload the photos you love.* No forms, no design choices. | Never ask them to be a designer (*Constitution, Art. VIII*). |
| **2. Entrusting** | "I'm handing over something precious." | Acknowledge the photos as *memories*, not files. Reassure on privacy. | Never say "processing images" or "uploading files." |
| **3. Anticipation** | "Something real is happening for me." | The narrated AI timeline (§2) — cinematic, story-led, honest. | Never fake work, never a dead spinner, never boredom. |
| **4. The Reveal** | Breath-catch. Surprise. Pride. | Reveal four finished masterpieces, cinematically (§4). | Never reveal a concept that failed the ≥90 gate. |
| **5. Recognition** | "That's *us*. That's the moment." | Beneath each concept, name the story we saw (§5). | Never invent a story that isn't in their photos (*Art. IX*). |
| **6. Ownership** | "This one. This is ours." | Effortless selection + gentle refinement (§6). | Never bury them in options. |
| **7. Pride-to-Share** | "I have to show someone." | Make sharing irresistible *before* purchase (§8). | Never gate the feeling behind a paywall. |
| **8. Commitment** | "Of course I'm keeping this." | Reveal price only after WOW is won (§9). | Never lead with price. |

The arc is **Story → Emotion → Pride → Share → Own** — the same order as the Constitution's
Decision Hierarchy (Art. III), felt from the customer's side.

---

## 2. The AI Processing Timeline (shown to the customer)

While the [Pipeline](WOW_ENGINE_PIPELINE.md) runs Stages 1–8, the customer sees a **narrated,
story-led sequence** — never technical, never "rendering." Each line is true (it maps to a real
stage), warm, and paced for anticipation.

**Canonical narration (customer-facing):**

```
   Uploading your memories…
✓  Understanding your story…
✓  Choosing the strongest hero photo…
✓  Ranking your memories by what matters most…
✓  Building your family's story…
✓  Designing like a professional creative director…
✓  Creating four masterpiece concepts…
✨  Your celebration is ready.
```

**Mapping to the Pipeline (never shown, kept honest):**

| Customer line | Pipeline stage |
|---|---|
| Uploading your memories… | Stage 1 — upload |
| Understanding your story… | Stage 2 — analyze every photo |
| Choosing the strongest hero photo… | Stage 4 — hero selection |
| Ranking your memories by what matters most… | Stage 3/5 — Memory Profile + supporting photos |
| Building your family's story… | Stage 3 — Memory Profile assembled |
| Designing like a professional creative director… | Stage 6 — art direction |
| Creating four masterpiece concepts… | Stage 6/7 — generate + score |
| Your celebration is ready. | Stage 8 — ≥90 concepts cleared for reveal |

**Timeline rules**
- **Honest theater.** Every line corresponds to real work; we may *pace* it, never *fake* it.
- **Bounded.** Target end-to-end **≤ 25s to First Reveal** (see §10 / Pipeline open-question on latency). If real work runs longer, the narration holds on the current true step — it never fabricates completion.
- **Occasion-aware copy.** Wording adapts to occasion tone (a memorial reads *"Honoring their story…"*, not *"Building your family's story…"*). Reverence is mandatory for Memorial/Military (*Design Bible occasion palettes; Constitution Art. VII*).
- **No dead air.** A subtle progress motion + the gold accent shimmer, on-brand, keeps the moment alive.
- **Says "celebration," not "banner."** *(Constitution Art. I.)*

---

## 3. The Four Premium Concepts

The engine reveals **four art-directed points of view** on the same Memory Profile — each a
complete, distinct interpretation, all governed by the Design Bible, all cleared ≥90. These are
the canonical four named in the Pipeline (Stage 6). They are *editorial identities*, not
templates.

### 3.1 Signature Edition — *the definitive one*
- **Point of view:** The timeless, balanced, "this is simply the best version." The safe-yet-stunning default most families choose.
- **Composition:** Commanding centered hero, symmetrical balance, generous white space. Classic/Pyramid lineage.
- **Palette:** Core Obsidian / Ivory / Luxury Gold, occasion mood layered lightly.
- **Typography:** Cormorant Garamond display, confident and upright; restrained supporting type.
- **Feels like:** the family portrait on the mantel. Quiet authority.
- **Best when:** one clearly dominant hero; any occasion.

### 3.2 Luxury Gold — *the premium keepsake*
- **Point of view:** Maximum craftsmanship and richness — the version that most obviously "costs more than it did." Gold as restraint, not glitter (*Design Bible Glow/Border standards*).
- **Composition:** Hero lifted with cinematic lighting, deep shadow, thin gold framing, mat-like negative space.
- **Palette:** Obsidian ground, deepened; gold accents concentrated on hero + one key word.
- **Typography:** The most formal treatment; gold-on-obsidian headline, elegant tracking.
- **Feels like:** a gallery edition / awards keepsake.
- **Best when:** triumph and prestige — Championship, Graduation, Corporate, Retirement.

### 3.3 Family Legacy — *the story across time*
- **Point of view:** Warmth and narrative — the version that honors *many* people and *the years*, organized by emotional importance (*Constitution Art. VI*), never by grid.
- **Composition:** Hero anchored, then Emotional Anchors and Story Builders arranged as a legible journey (Magazine/Mosaic lineage) — still hierarchical, never a contact sheet.
- **Palette:** Warmer layer within brand core; softer light, inviting.
- **Typography:** Approachable elegance; room for names/roles the customer supplied (never invented).
- **Feels like:** the heirloom a grandchild will treasure.
- **Best when:** many meaningful photos — Family Reunion, Wedding, Memorial, Church, Birthday.

### 3.4 Modern Editorial — *the confident, contemporary one*
- **Point of view:** Magazine-cover boldness — asymmetry with intent, dramatic scale, editorial typography. Modern without being trendy (*Constitution — timelessness clause*).
- **Composition:** Off-center hero, strong typographic architecture, decisive negative space; deliberate asymmetry that energizes (*Golden Rule 15*).
- **Palette:** Sharpest contrast within brand; disciplined single-accent restraint.
- **Typography:** Largest, most architectural headline treatment; type as composition.
- **Feels like:** a premium magazine cover of their moment.
- **Best when:** a striking single hero; younger families; Championship, Graduation, Corporate.

> **Invariant across all four:** the hero is sacred; no filler; beauty over quantity; every concept
> independently ≥90 or it is never shown (*Pipeline Invariants*).

---

## 4. The Reveal Screen Layout

The reveal is a **cinematic event**, not a results grid. It is the payoff of the entire arc.

**Sequence**
1. **The hush** — brief full-bleed dark moment, gold shimmer, headline: *"Your celebration is ready."*
2. **The first reveal** — the engine's **top-scoring** concept animates in, full and large, alone, for a beat. This is engineered to be the **First WOW** (§10 metric).
3. **The gallery** — the remaining three fade in as a selectable set of four.

**Layout (responsive)**
- **Desktop:** hero concept large left/center; the four selectable as a refined filmstrip/gallery. One concept "active" and enlarged at a time.
- **Mobile:** full-width vertical swipe carousel; one masterpiece per screen, edge-to-edge, generous margin.
- **Every concept shown at true aspect** (portrait poster, landscape banner, square social) — never distorted.
- **Watermarked preview** (protected, share-safe) until purchase; the *feeling* is never gated.
- **Chrome is minimal** — the artwork dominates; UI recedes (*Constitution Art. V — luxury is restraint*).

**On-screen elements per concept**
- The concept **name** (Signature Edition, etc.).
- The **explanation** (§5).
- An optional **WOW badge** (§7).
- A single primary action: **"Make this mine"** · secondary: **Refine** (§6) · tertiary: **Share** (§8).

Price is **absent** from the reveal (§9).

---

## 5. The Explanation Beneath Each Concept

Beneath each concept, the AI Creative Director says — in one or two warm sentences — *what story
it saw and why this design honors it.* This turns a picture into recognition ("that's *us*").

**Rules**
- **Story-first, not feature-first.** Say *"We built everything around the moment you crossed the stage,"* not *"Centered hero with 24px gold border."*
- **True only.** Reference only what is real in their photos (*Art. IX — never invent memories or relationships*).
- **Names the hero choice** — this builds trust in the AI's judgment.
- **One human voice**, never a spec sheet.

**Examples (illustrative)**
- *Signature Edition:* "We made your cap-and-gown moment the star and let everything else breathe around it — the way you'll remember this day."
- *Luxury Gold:* "We lifted the trophy shot into the spotlight and framed it in gold, so the win feels as big as it was."
- *Family Legacy:* "We arranged four generations around Grandma's portrait, oldest memories to newest, so the whole story reads at a glance."
- *Modern Editorial:* "We gave the winning shot magazine-cover scale and let the year headline the moment."

---

## 6. Customer Refinement Actions

Refinement exists to give **ownership without burden**. The customer nudges; the AI still does the
hard creative work (*Constitution Art. VIII — the customer never becomes a designer*). Actions are
**few, high-level, and reversible.**

**Allowed (the short list)**
1. **Choose a different concept** — the primary "refinement" is simply picking among the four.
2. **Change the hero** — "Make a different photo the star." The engine re-art-directs around the new hero (re-runs the relevant stages), never just swaps a slot.
3. **Regenerate this concept** — "Try another take." Produces a fresh ≥90 variation of the same edition.
4. **Edit the words** — headline / name / date / short line. Typed text only; the AI sets the type.
5. **Adjust emphasis (optional, gentle):** "More photos" ↔ "Simpler" — a single high-level dial the AI interprets within Bible limits; it never exposes raw layout controls.

**Forbidden (by design)**
- No manual drag-and-drop layout, no per-element position/scale/rotation, no font pickers, no color wheels, no sticker trays, no "customize everything" panel.
- No action may push a design **below 90** — refinements that would violate the Bible are quietly resolved by the AI, not surrendered to the customer.

**Behavior**
- Every refinement re-enters the pipeline at the right stage and re-passes the ≥90 gate before it's shown.
- Refinement latency target is short (§10) with the same honest micro-narration.

---

## 7. WOW Score Presentation

The **WOW Score** (100-point, 8 dimensions: Hero Strength, Emotional Impact, Storytelling, Layout
Balance, Typography, Color Harmony, Luxury Finish, Shareability — *Design Bible Part 7 / Pipeline
Stage 7*) is primarily an **internal gate**. Customer exposure is a **trust and delight** device,
used with restraint.

**Principles**
- **The gate is invisible; the confidence is visible.** The customer never sees a sub-90 concept, so every score they *could* see is already excellent.
- **Frame as reassurance, never as a grade of their photos.** The score rates *our design*, never the family or their pictures (*Art. IX — never misrepresent people*).

**Presentation options (to A/B in build)**
- **A — Badge only (default recommendation):** a subtle "✨ Masterpiece · 9x/100" badge or a "Passed all 10 of the Masterpiece Test" seal (*Constitution Art. XIII*). Communicates rigor without turning the reveal into a scoreboard.
- **B — Quiet breakdown on demand:** tapping the badge reveals the 8 dimensions as a small, elegant readout ("Emotional Impact · Exceptional") — words, not just numbers.
- **C — Hidden entirely:** score stays internal; the artwork speaks for itself (most in keeping with Art. V restraint).

**Rule:** a visible score must **add** confidence and never introduce comparison anxiety. If it ever
makes a customer hesitate between two masterpieces on a single point, hide it. The **Masterpiece
Test seal** (Art. XIII) is preferred over a raw number as the public signal.

---

## 8. Shareability Strategy

Pride wants an audience. We let the customer **share the WOW before they buy** — this is both a gift
to them and our most honest growth engine (a masterpiece is its own advertisement).

**Mechanics**
- **Share-before-purchase**, always available at the reveal. The *feeling* is never paywalled (§1, Phase 7).
- **Beautiful, protected artifact:** a watermarked, on-brand preview image + a share link to a lightweight reveal page — never the full-resolution print file.
- **One-tap channels:** text/iMessage, WhatsApp, Instagram/Facebook, email, copy-link — mobile-first.
- **Share copy pre-written**, in-voice: *"I can't believe this came from our photos 😮"* / *"Look what CelebrateBanner made of [Name]'s graduation."* (customer can edit; never auto-posts).
- **The recipient's view sells for us:** the shared page shows the masterpiece + a soft "Make one for your family" invite (referral-attributed).

**Guardrails**
- Watermark protects the unpurchased asset (consistent with current preview-lock philosophy).
- No private photos are exposed beyond what the customer chooses to share.
- Sharing is celebrated, never nagged — one clear invite, no dark patterns (*Art. V restraint*).

**Why it matters:** the **Share Rate** (§10) is our leading indicator that we produced genuine WOW —
people don't share "fine."

---

## 9. Pricing Reveal Sequence (after concept selection)

**WOW is won before price is shown.** Leading with price reframes a keepsake as a purchase and
kills the emotion (*Art. I — we're not selling banners*). The sequence:

1. **Reveal (no price).** Customer feels it, shares it, picks "Make this mine."
2. **Format moment.** *"How would you like to keep it?"* — the product/package choice (digital,
   printed, framed, bundle, etc.) presented as **ways to hold the memory**, not SKUs. (Prices/tiers
   come from the existing, unchanged pricing model — this spec proposes **no pricing changes**.)
3. **Value framing.** Each option is described by what the family *gets to do* (hang it, gift it,
   keep the file forever), consistent with the Constitution's language.
4. **Price appears** — clean, confident, unapologetic, beside the chosen format. No fake urgency, no
   dark patterns.
5. **Gentle upsell, not pressure.** Premium/framed/bundle presented as "the way to make it last,"
   honoring the "more valuable with time" principle — the customer may always choose the simplest
   option without friction.
6. **Checkout** — the existing, unchanged checkout flow. Email capture / save-my-proof already
   supports returning to this exact masterpiece (Sprint 1, Milestones 1–2).

> This section is **sequence and framing only.** Actual prices, packages, and checkout are governed
> by the existing app and are explicitly out of scope here.

---

## 10. Success Metrics

Four headline metrics, each tied directly to the North Star. Definitions are proposals for
instrumentation (privacy-safe, aggregate; no change to current tracking is made by this document).

### 10.1 WOW Rate — *did we move them?*
- **Definition:** % of completed reveals that produce a genuine positive reaction signal — an explicit "WOW"/reaction tap, an immediate share, a save, or proceeding to "Make this mine" without regenerating away.
- **Why:** the truest measure of the mission — a masterpiece that *lands.*
- **Target (draft):** ≥ 70% of reveals.
- **Instrument:** reaction control on the reveal + downstream select/share events.

### 10.2 Share Rate — *did they need to show someone?*
- **Definition:** % of reveals that result in at least one share action (pre- or post-purchase).
- **Why:** people share pride, not adequacy; our most honest quality + growth signal.
- **Target (draft):** ≥ 30% of reveals; each share attributed for referral lift.
- **Instrument:** share events by channel + shared-page views/conversions.

### 10.3 Purchase Rate — *did WOW convert?*
- **Definition:** % of reveals that reach a completed order.
- **Why:** proves the WOW → format → price sequence (§9) converts emotion into commitment without cheapening it.
- **Target (draft):** meaningful lift over the current builder's baseline (measured, not assumed).
- **Instrument:** reveal → select → checkout funnel; ties to the existing order-status pipeline (Sprint 1, M5) and admin funnel.

### 10.4 Time to First WOW — *how fast did we earn the reaction?*
- **Definition:** median time from upload-complete to the **first concept fully revealed** (the moment engineered in §4, step 2).
- **Why:** anticipation is an asset only while bounded; delay past a point erodes WOW.
- **Target (draft):** ≤ 25s median (aligns with the Pipeline latency open-question).
- **Instrument:** timestamped upload-complete → first-reveal-rendered.

**Reporting:** these surface in the admin funnel/reporting layer (extending Sprint 1, Milestone 4)
as an additive, privacy-safe reporting concern — **no card/photo data**, aggregate only. Defining
the exact events is a build-phase task, flagged here, not implemented.

---

## Cross-References & Open Questions

**Governed by:** [Creative Constitution](CREATIVE_CONSTITUTION.md) (esp. Art. I, III, V, VI, VIII,
IX, XIII + The Promise) · [Design Bible](CELEBRATEBANNER_DESIGN_BIBLE.md) (palettes, typography,
lighting, WOW Score Part 7) · [WOW Engine Pipeline](WOW_ENGINE_PIPELINE.md) (Stages 1–8, ≥90 gate,
invariants).

**Inherits the Pipeline's open spec questions** (Memory Profile schema, scoring source,
regeneration budget, hero tie-breaking, minimum viable photo set, latency budget, compute
location) and adds its own for the build phase:
1. **Reveal choreography** — exact animation timing/curve for the "hush → first reveal → gallery."
2. **Score visibility** — which of §7's options (A/B/C) wins the A/B test.
3. **Refinement budget** — how many hero-swaps/regenerations before a gentle stop, and the fallback.
4. **Metric event schema** — precise, privacy-safe events for the four §10 metrics.
5. **Occasion narration table** — full per-occasion copy for §2 (esp. Memorial/Military reverence).

---

**Status:** Draft v0.1 — planning only. No production code, no pricing/renderer/checkout changes,
no commits. The current builder remains the stable fallback; the WOW Engine is additive and
reversible.
