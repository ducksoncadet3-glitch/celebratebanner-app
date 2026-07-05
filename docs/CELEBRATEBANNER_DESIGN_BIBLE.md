# CelebrateBanner 2.0 — Design Bible

> **Status:** Draft for review. Planning/documentation only — no code changes authorized yet.
> **Owner:** Duckson Cadet (Founder & CEO), CDN4 LLC (DBA CelebrateBanner)
> **Companion to:** [CELEBRATEBANNER_2_0_BLUEPRINT.md](CELEBRATEBANNER_2_0_BLUEPRINT.md)
> **Authority:** This document is the **permanent visual authority** for CelebrateBanner. It defines every future renderer, layout, typography rule, AI composition decision, color palette, spacing rule, and product design. **Claude Code and all contributors treat this document as the single source of truth for all rendering work.** The Blueprint governs *what and why*; the Design Bible governs *how it must look and feel*. Neither may be overridden by an implementation shortcut.

---

## Core Standard

**CelebrateBanner is not a banner builder. It is an AI Celebration Studio.**
Every output must move the customer toward one sentence:

> **"I can't believe it created this from my photos."**

If a design does not earn that reaction, it is not finished.

---

## PART 1 — The Design Philosophy

### The Creative Director Doctrine

> **The AI is not a collage generator.**
> **The AI is not a template engine.**
> **The AI is the Creative Director of CelebrateBanner.**
>
> Every rendering decision should answer:
> - **What story are we telling?**
> - **What emotion are we creating?**
> - **Which memory deserves attention?**
> - **Which photo should become unforgettable?**
>
> **Luxury is not decoration. Luxury is restraint.**
> White space is intentional.
> The hero photo is sacred.
> Every supporting image exists only to strengthen the hero.
> Never fill empty space simply because space exists.
>
> **Beauty always wins over quantity.**
> **Storytelling always wins over symmetry.**
> **Emotion always wins over technical perfection.**
>
> A customer should immediately recognize the hero.
> A family should immediately recognize the story.
>
> Every masterpiece should feel professionally art-directed.
> Every masterpiece should feel unique.
> Every masterpiece should be worthy of framing.
> Every masterpiece should be worthy of sharing.
>
> **If the result does not create a "WOW" reaction… it is not finished.**

### Principles

- **We are not creating graphics. We are creating heirlooms.**
- **Every masterpiece should be worthy of hanging in a family's home.**
- **Beauty is more important than complexity.** The simplest design that moves someone beats the most intricate one that doesn't.
- **Emotion is more important than decoration.** A decorative flourish that doesn't deepen feeling is noise.
- **Luxury is the default.** The baseline output looks premium — never "budget," never "template."
- **Storytelling always wins.** When a choice is unclear, choose the option that tells the celebration's story best.
- **The customer is never the designer.** We never hand the burden of taste back to them.
- **The AI is the Creative Director.** It curates, composes, and decides with professional judgment.

**Governing rule:** When any decision is ambiguous, choose the more **restrained, more emotional, more display-worthy** result — even if that means fewer photos and fewer words.

---

## PART 2 — Visual Language

### Primary Colors (fixed brand foundation)

| Token | Value | Name | Role |
|-------|-------|------|------|
| `--obsidian` | `#0C0E14` | Obsidian | Primary ground; luxury depth |
| `--ivory` | `#FAF8F3` | Ivory | Primary light text / clean fields |
| `--gold` | `#C9A84C` | Luxury Gold | Signature accent |
| `--gold2` | `#E8C97A` | Highlight Gold | Gradient mid |
| `--gold3` | `#F5E4B0` | Light Gold | Gradient tip / shimmer |

These three — **Obsidian, Ivory, Luxury Gold** — are the immovable brand core. They appear, in some form, in every product and every concept.

### Secondary / Support Palette
- `--sky` `#4A9ECC` — restrained cool accent (sports/digital); never a primary.
- `--rose` `#C4617A` — **UI warning/error only.** Never decorative in a design.
- `--sage` `#5A8F6A` — **UI success only.** Never decorative in a design.
- `--border` `rgba(201,168,76,0.18)` — hairline gold structure.

### Occasion Palettes
Each occasion layers a mood palette **on top of** the Obsidian/Ivory/Gold core — it never replaces it.

| Occasion | Ground | Accent | Text/Highlight | Mood |
|----------|--------|--------|----------------|------|
| **Graduation** | Obsidian `#0C0E14` | Luxury Gold `#C9A84C` | Ivory | Pride, arrival, timeless |
| **Championship** | Deep obsidian + spotlight | Gold `#C9A84C` + sky `#4A9ECC` restraint | Ivory / gold gradient | Triumph, glory, drama |
| **Wedding** | Ivory-forward `#FAF8F3` / soft champagne | Luxury Gold, blush-neutral | Obsidian text | Romance, elegance, purity |
| **Birthday** | Obsidian or warm charcoal | Gold + one warm celebratory accent | Ivory | Joy, warmth, vibrancy (still refined) |
| **Memorial** | Deep obsidian / muted charcoal | Soft muted gold | Ivory, low contrast | Reverence, warmth, peace |

> Occasion palettes tune emotion; they do **not** license neon, clashing, or off-brand color. Gold restraint always applies.

### Lighting Standards
- Every hero feels **lit**, not flat: subtle spotlight/glow on the focal photo, deepened surrounding shadow.
- Light direction is consistent within a design. No conflicting light sources.
- Cinematic, believable — never a hard flash look.

### Shadow Standards
- Soft, directional, believable depth. Shadows establish hierarchy (hero floats above supporting photos).
- **Forbidden:** hard default drop shadows, harsh black offsets, generic CSS box-shadows.

### Glow Standards
- Glow is a gold/warm accent used sparingly to draw the eye to the hero or a key word.
- **Forbidden:** neon glow, glow on every element, glow used as decoration rather than emphasis.

### Border Standards
- Hairline gold (`--border`) or thin metallic gold lines for structure and framing.
- **Forbidden:** thick clunky borders, multiple stacked ornate frames, borders that cage the design.

### Negative Space & White Space
- Whitespace (or "dark space" on obsidian) is a **primary design element**, not empty space to fill.
- The eye needs room to rest and a clear path to the hero.

### Safe Margins
- Print safe margin ≥ **0.25 in**; bleed **0.125 in** on all sides (per output specs, 300 DPI / CMYK).
- No critical text or faces inside the bleed or within the safe margin.

### Background Rules
- Backgrounds support, never compete. Obsidian grounds, subtle gradients, gentle grades, or a softly blurred extension of the hero.
- **Forbidden:** busy patterned backgrounds, stock scenery that fights the photos, flat pure-black `#000000` (use Obsidian).

### Texture Rules
- Subtle only — fine grain, soft paper texture (Family Legacy), gentle vignette.
- **Forbidden:** loud textures, visible tiling, gimmicky material overlays.

### Gradient Rules
- Gold gradients (`gold → gold2 → gold3`) for metallic headline type and accents.
- Tonal obsidian gradients for depth and scrims behind text.
- **Forbidden:** rainbow gradients, harsh banding, gradients that muddy legibility.

### Decorative Element Rules
- Decoration must **serve emotion or hierarchy**. If it does neither, remove it.
- Allowed: thin gold rules, corner flourishes (restrained), spotlight rays (championship), soft accent bars.
- **Forbidden:** clip art, emoji-as-decoration, stickers, stock confetti, generic shapes for their own sake.

### Rules for Luxury Appearance
Luxury = **restraint + craft + light**. Achieved through disciplined spacing, one strong hero, premium type, subtle gold, and cinematic lighting — never through *adding more*.

### Allowed vs. Forbidden — quick examples
| Allowed ✅ | Forbidden ❌ |
|-----------|-------------|
| One dominant hero, generous margins | Grid of equal-size photos edge to edge |
| Thin gold accent line under the name | Thick gold bar across the whole poster |
| Soft blurred fill for off-ratio photos | Black letterbox bars or stretched photos |
| Gold gradient headline on obsidian | Neon glow headline, drop-shadowed text |
| Subtle vignette focusing the hero | Busy patterned/stock background |
| Restrained corner flourish | Clip art, emoji, stickers, confetti |

---

## PART 3 — Typography

### Fonts
- **Display font:** Cormorant Garamond — headlines, names, elegant statements.
- **Supporting font:** Outfit — labels, body, UI, secondary information.
- **No system fonts** in any output.

### Headline Hierarchy
1. **Hero photo** (the strongest element overall).
2. **Primary name** (graduate/honoree/family) — strongest text.
3. **Headline / occasion statement** — one only, never two competing.
4. **Year / date** — supporting accent.
5. **Institution / team / supporting labels** — quietest.

### Graduate Name
- Second-strongest element after the hero; often the strongest *text*.
- Cormorant Garamond, large, elegant, gold gradient or ivory. Proper capitalization; refined small caps acceptable. Never crowded.

### Family Name
- Warm, prominent, central to Family Legacy work. Classic serif treatment; honors the collective.

### School Name
- Outfit or refined small caps; a contextual label secondary to the name. Concise; long names scale gracefully, never squeezed.

### Coach Name
- Supporting label (team/senior-night contexts). Secondary to athlete/team name; elegant, small, never competing.

### Quote Styling
- Optional, short (1–2 lines), elegant italic or refined body. A grace note, never a paragraph. If it lowers the WOW Score, omit it.

### Year Styling
- Refined gold label — spaced small caps or a framed accent. Supporting, never a headline; never competes with the name.

### Distance Readability
- These are wall pieces. Primary text (name, headline) legible from **8–10 feet**: generous size, strong contrast, clear figure/ground (scrim behind text over busy photos).

### Print Readability
- Type rendered at **300 DPI**; hairlines and thin strokes tested to survive CMYK print. No sub-pixel-thin gold on obsidian that vanishes in print.

### Color Combinations
- **Preferred:** gold gradient on obsidian; ivory on obsidian; obsidian on ivory (wedding); muted gold on charcoal (memorial).
- **Forbidden:** gold on ivory without a dark backing (low contrast), light text on busy photo without scrim, rose/sage as text color in designs.

### Safe Spacing
- Generous letter/line spacing tuned per concept. Names and headlines get breathing room; nothing kerns into a photo edge.

### Maximum Line Lengths
- Headlines: short, one line preferred. Body/quote: ≤ ~40–50 characters per line for elegance and readability. Long strings wrap gracefully or scale down — never squeeze to fit.

### Typography Mistakes to Avoid
- Two competing headlines. All-caps everything. System/default fonts. Text over a busy photo with no scrim. Stretched or condensed type to fit. Tiny unreadable print. Gold text with insufficient contrast. Overusing effects (glow, hard shadow) on text.

---

## PART 4 — Photo Treatment

### Hero Image Rules
- **The hero must dominate** — largest, best-lit, most prominent; anchors the entire composition.
- Chosen for sharpness, exposure, emotional strength, and a clean, protectable face/subject.

### Supporting Image Rules
- **Never compete with the hero.** Smaller, quieter, arranged to lead the eye back to the hero.
- Unified grade so they read as one collection. Weak photos are cut, not shrunk in.

### Orientation Handling
- **Portrait:** ideal for hero and vertical layouts; protect head/eyes on the upper third.
- **Landscape:** strong for wide heroes and banners; crop to strengthen composition, never to sever subjects.
- **Square:** flexible for supporting grids and social; center the subject; avoid awkward tight crops.

### Cropping Philosophy
- Crop to **strengthen composition and emotion**, not merely to fit a frame. Rule-of-thirds focal placement; decisive, intentional crops.

### Face Safety
- **Never crop through faces.** Never cut the top of a head awkwardly. Detect and protect faces before any crop; keep eyes near the upper-third line where possible.

### Blurred Background Fills
- When a photo doesn't fill its frame, extend it with a **soft blurred version of the same image**. **Never** letterbox black bars. **Never** stretch to fill.

### Image Enhancement
- Gentle, invisible improvement. Enhance clarity and light; never over-process, never make faces look artificial or "beautified."

### Color Correction
- Subtle unifying grade so photos from different cameras/eras feel like one collection. Correct white balance and exposure with restraint.

### Noise Reduction
- Reduce noise/grain gently on low-quality inputs; preserve natural detail — no plastic, over-smoothed look.

### Old Photo Restoration
- For heirloom/memorial content: reduce fading, correct color shift, gently repair — while preserving the photo's authentic character. Restoration serves reverence, not "modernizing."

### Contrast
- Cinematic contrast that gives depth; never crushed blacks that lose detail or blown highlights that lose faces.

### Lighting
- Enhance the sense of light on the hero (subtle spotlight/glow); harmonize lighting across supporting photos.

### The Three Nevers
- **Never distort.** Scale proportionally; crop instead of warp.
- **Never overcrowd.** Restraint over density; leaving photos out is encouraged.
- **Never let supporting photos compete with the hero.**

---

## PART 5 — The Four Premium Concepts

Every reveal presents these four complete, distinct concepts. **Each must independently clear the WOW Score (≥90).**

### Signature Edition
- **Emotion:** Timeless pride, confident elegance.
- **Mood:** Calm, assured, classic.
- **Story:** "This moment mattered, and it always will."
- **Ideal celebration:** Graduations, achievements, milestones — the universally flattering default.
- **Layout philosophy:** Strong central hero, disciplined supporting grid, generous margins, single clear focal path.
- **Typography:** Cormorant Garamond display + Outfit support; high contrast, elegant hierarchy.
- **Lighting:** Even, refined; gentle spotlight on the hero.
- **Background:** Obsidian or subtle tonal gradient.
- **Decorations:** Thin gold accent lines, restrained framing.
- **Allowed effects:** Soft depth, subtle grade, hairline gold.
- **Forbidden effects:** Heavy ornamentation, tilts, glow overload.
- **Do:** Center the hero, let margins breathe, one headline.
- **Don't:** Fill every corner, add ornate borders, tilt photos.

### Luxury Gold
- **Emotion:** Opulence, celebration, "this is a big deal."
- **Mood:** Red-carpet, radiant, dramatic.
- **Story:** "A triumph worth its weight in gold."
- **Ideal celebration:** Championships, galas, major honors, anniversaries.
- **Layout philosophy:** Dramatic hero with spotlight, luxurious negative space, gold framing, symmetrical grandeur.
- **Typography:** Large Cormorant Garamond in gold gradients; letter-spaced small-caps labels.
- **Lighting:** Cinematic — spotlight, warm highlights, deep shadow, gentle hero vignette.
- **Background:** Deep obsidian with gold glow accents.
- **Decorations:** Champagne-gold gradients, foil-like accents, elegant corner flourishes — restrained.
- **Allowed effects:** Gold glow (as emphasis), cinematic grade, spotlight.
- **Forbidden effects:** Flat gold flooding, stacked ornate borders, gold on every element.
- **Do:** Use gold as radiant metallic accent; spotlight the hero.
- **Don't:** Drown the canvas in gold or over-frame.

### Family Legacy
- **Emotion:** Warmth, belonging, generational love.
- **Mood:** Heartfelt, nostalgic, enduring.
- **Story:** "Our family, across time, together."
- **Ideal celebration:** Family reunions, memorials, retirements, anniversaries.
- **Layout philosophy:** Narrative flow (timeline or gathered-memories), hero plus meaningful cluster, room around every face.
- **Typography:** Warm classic serif display + humanist body; approachable elegance.
- **Lighting:** Soft, warm; gentle unifying glow.
- **Background:** Subtle warm texture or soft tonal ground.
- **Decorations:** Understated gold detail, soft edges, tasteful dates/captions when meaningful.
- **Allowed effects:** Warm grade, soft vignette, gentle texture.
- **Forbidden effects:** Cold grids, heavy captions, corporate stiffness.
- **Do:** Tell a story, protect every face, keep warmth.
- **Don't:** Grid coldly, over-caption, feel clinical.

### Modern Editorial
- **Emotion:** Bold, current, confidently stylish.
- **Mood:** Magazine-grade, fashion-forward.
- **Story:** "This moment, styled like a cover."
- **Ideal celebration:** Social graphics, senior night, sports, younger/brand-forward audiences.
- **Layout philosophy:** Editorial asymmetry, oversized hero, deliberate off-grid tension, bold negative space, strong type blocks.
- **Typography:** Large confident type, tight tracking; sans-forward hierarchy with a refined serif accent.
- **Lighting:** Punchy, high-contrast, decisive.
- **Background:** Clean obsidian or bold single-tone.
- **Decorations:** Geometric accents, bold rules; gold as highlight only.
- **Allowed effects:** Scale contrast, asymmetry, punchy grade.
- **Forbidden effects:** Centered symmetry everywhere, clutter, gold overuse.
- **Do:** Embrace scale contrast and intentional asymmetry.
- **Don't:** Center everything or fill the negative space.

---

## PART 6 — Product Design Standards

All products inherit Parts 1–5. Below are per-product emphases.

### Current Products

#### Graduation Poster
- **Purpose:** Celebrate an earned milestone; a keepsake of arrival.
- **Emotion:** Pride, arrival, timelessness.
- **Visual hierarchy:** Hero graduate → name → year/school labels.
- **Hero treatment:** Dominant, spotlighted graduate portrait.
- **Photo count philosophy:** One strong hero + a few best supporting; fewer is better.
- **Preferred layout:** Signature Edition or Luxury Gold.
- **Typography:** Cormorant name prominent; gold year label.
- **Background:** Obsidian with gold accents.
- **Allowed decorations:** Thin gold lines, refined year label.
- **Forbidden decorations:** Cap-and-gown clip art, cluttered collages, competing headlines.

#### Team Banner
- **Purpose:** Rally shared identity and unity.
- **Emotion:** Strength, belonging, energy.
- **Visual hierarchy:** Hero (star/team shot) → team name → supporting players.
- **Hero treatment:** Bold, spotlighted, cinematic contrast.
- **Photo count philosophy:** One hero + balanced supporting grid; never all players equal-size.
- **Preferred layout:** Modern Editorial or Luxury Gold.
- **Typography:** Strong team name; restrained sky/gold accents.
- **Background:** Deep obsidian with spotlight rays.
- **Allowed decorations:** Spotlight, gold/sky accent bars.
- **Forbidden decorations:** **Licensed logos or player likenesses.** Clutter, equal-grid sameness.

#### Championship Poster
- **Purpose:** Immortalize a triumph.
- **Emotion:** Glory, victory, "we won."
- **Visual hierarchy:** Triumphant hero → bold headline → year label.
- **Hero treatment:** Maximum drama — gold glow, spotlight, deep shadow.
- **Photo count philosophy:** One dominant hero; supporting kept minimal.
- **Preferred layout:** Luxury Gold.
- **Typography:** Bold Cormorant headline; gold year.
- **Background:** Deep obsidian, gold glow.
- **Allowed decorations:** Gold glow, spotlight, corner flourish.
- **Forbidden decorations:** Flat gold washes, busy backgrounds, licensed marks.

#### Social Graphics
- **Purpose:** Instantly shareable pride.
- **Emotion:** Excitement, shareability.
- **Visual hierarchy:** Hero → short bold statement → minimal labels.
- **Hero treatment:** Punchy, thumbnail-legible.
- **Photo count philosophy:** Minimal — one or few; clarity at small scale.
- **Preferred layout:** Modern Editorial.
- **Typography:** Bold, large, legible at thumbnail scale.
- **Background:** Clean obsidian or bold single-tone.
- **Allowed decorations:** Geometric accents, bold rules.
- **Forbidden decorations:** Tiny text, print-only compositions that break on mobile.

#### Senior Night Package
- **Purpose:** Honor a bittersweet farewell moment.
- **Emotion:** Pride, nostalgia, celebration.
- **Visual hierarchy:** Hero athlete → name/number → year & supporting moments.
- **Hero treatment:** Cinematic lighting, prominent athlete.
- **Photo count philosophy:** Hero-led; a few meaningful supporting shots.
- **Preferred layout:** Modern Editorial or Signature Edition.
- **Typography:** Prominent name/number; gold accents.
- **Background:** Obsidian with cinematic light.
- **Allowed decorations:** Gold accents, spotlight.
- **Forbidden decorations:** Licensed logos, generic sports templates, overcrowding.

### Future Products (creative direction seeds)

| Product | Emotion | Lead concept | Palette lean | Notes |
|---------|---------|--------------|--------------|-------|
| **Wedding** | Romance, elegance | Signature / Luxury Gold | Ivory-forward + gold | Purity, refinement; couple as hero |
| **Birthday** | Joy, warmth | Modern Editorial / Signature | Obsidian + warm accent | Vibrant yet refined; age/name feature |
| **Baby Shower** | Tenderness, hope | Family Legacy / Signature | Soft neutrals + gold | Gentle, delicate, warm |
| **Retirement** | Gratitude, legacy | Family Legacy / Luxury Gold | Obsidian + gold | Career arc as story; honor the years |
| **Family Reunion** | Belonging, togetherness | Family Legacy | Warm tonal + gold | Many faces, protected; narrative flow |
| **Church** | Reverence, community | Signature / Family Legacy | Obsidian + gold | Dignified, warm, uplifting |
| **Military** | Honor, sacrifice, pride | Luxury Gold / Signature | Obsidian + restrained gold | Dignity first; no cheap patriotism clichés |
| **Corporate** | Achievement, professionalism | Modern Editorial / Signature | Obsidian + gold | Clean, premium, brand-respectful |
| **Memorial** | Reverence, warmth, peace | Family Legacy | Muted obsidian + soft gold | Restoration, low contrast, deep respect |

---

## PART 7 — The WOW Score

A 100-point rubric applied to **every** generated concept.

| Category | Points | What it measures |
|----------|--------|------------------|
| Hero Strength | 15 | One dominant, well-chosen, well-lit hero |
| Emotional Impact | 20 | Does it make you feel the moment? |
| Storytelling | 15 | Does the arrangement convey the celebration's story? |
| Layout Balance | 15 | Composition, focal path, whitespace discipline |
| Typography | 10 | Hierarchy, elegance, distance/print readability |
| Color Harmony | 10 | Palette discipline, unifying grade, gold restraint |
| Luxury Finish | 10 | Lighting, shadows, framing — heirloom quality |
| Shareability | 5 | Does the customer want to send it before buying? |
| **Total** | **100** | |

### The 90 Rule
> **Never present a concept below 90.**
> **If a concept scores below 90, generate another concept** (regenerate or discard — never reveal it). All four revealed concepts must independently clear 90. The score is a hard gate, not a suggestion.

---

## PART 8 — Shareability

> **Every design should make the customer want to send it to family before purchasing.**

### Social Share Principles
- Reads beautifully at **phone-screenshot scale**, not only at print size.
- Composed to survive square and vertical crops for social platforms.

### Preview Principles
- The **free AI preview is the marketing.** It must look finished and premium — never watermark-mangled into ugliness.
- The reveal is cinematic and pride-inducing.

### Presentation Principles
- Concepts are presented as complete masterpieces, not drafts. Confident framing, generous spacing, no clutter around the reveal.

### What Makes a Design "Share-Worthy"
- One clear emotional focal point (the hero).
- Instantly readable name/headline.
- Premium finish that signals "this is special."
- A feeling the customer wants others to feel too. If they wouldn't screenshot it, it isn't good enough.

---

## PART 9 — The Competitive Moat

CelebrateBanner **cannot be reduced to "AI"** — anyone can call a model. The defensible advantages:

- **Taste** — a codified, enforced standard of beauty (this Bible).
- **Creative direction** — an AI Creative Director that decides, not a generator that outputs.
- **Celebration intelligence** — occasion-aware judgment (a graduation is composed differently than a memorial).
- **Storytelling** — designs engineered around narrative and emotion.
- **Luxury standards** — an heirloom quality bar competitors won't match.
- **Four premium concepts** — a curated reveal of complete, distinct, ≥90-WOW options.
- **Family trust** — reverence and quality that families rely on for their most important moments.
- **Celebration Library** — saved celebrations, reorders, reminders that compound loyalty over a lifetime.
- **Brand consistency** — one recognizable standard across every product and occasion.

Competitors can copy features. They cannot easily copy taste, emotional intelligence, and the trust of families who return for every milestone.

---

## PART 10 — Claude Code Design Rules

Future Claude implementations must:

- **Never invent visual direction.** Implement to this Bible.
- **Never violate this Design Bible.** It outranks convenience.
- **Never sacrifice beauty for complexity.** Simpler and more beautiful wins.
- **Never use every photo simply because it exists.** Curate; cut weak photos.
- **Prefer emotional storytelling** over decoration.
- **Prefer elegant restraint** over density.
- **Protect luxury standards** — lighting, spacing, premium type, gold restraint.
- **Maintain brand consistency** — Obsidian/Ivory/Gold, Cormorant + Outfit, 300 DPI / CMYK.
- **Enforce the gate:** any new renderer or layout must pass the WOW Score (≥90) and every Design Bible rule before it is shown to a customer or shipped.

---

## PART 11 — The Master Principles

> **We don't create posters. We create memories.**
> **We don't print banners. We preserve milestones.**
> **We don't impress customers. We move families.**
>
> **Every masterpiece carries the CelebrateBanner name.**

---

## Guardrails for This Planning Phase

Documentation only. Until explicitly approved and directed:
- Do **not** modify `index.html`.
- Do **not** modify `server.js`.
- Do **not** modify pricing, rendering, or app behavior.
- Do **not** commit.
- Do **not** push.
