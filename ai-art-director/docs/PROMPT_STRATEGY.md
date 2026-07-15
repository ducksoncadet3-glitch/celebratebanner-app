# Prompt-Building Strategy

**Deliverable #4.** How a deterministic, versioned prompt is composed for every job.

## 1. Principle: layered composition

A prompt is **built**, never hand-written per order. `PromptBuilder` deterministically
composes ordered layers so the same inputs always yield the same prompt bundle:

```
[1] STYLE CONSTITUTION   ← from Gold Standard: cinematic, editorial, luxury, print-safe
[2] COMPOSITION CONTRACT  ← from Gold Standard: grid, hero placement, hierarchy, palette rules
[3] PRODUCT VOICE         ← from Adapter: wording, motifs, decorations, tone, footer meaning
[4] SUBJECT / INPUTS      ← from customer: names, year, colors, photo-slot roles
[5] PHOTO CONDITIONING    ← from AssetService: hero cutout ref, per-slot descriptors
[6] NEGATIVES / GUARDRAILS← safety + brand: no logos/likenesses, no text artifacts, no distortion
[7] OUTPUT CONTRACT       ← print spec: 24×18", 300 DPI, bleed, safe area, CMYK-safe palette
```

Layers 1–2 are shared across all products. Layer 3 is per-product. Layers 4–5 are
per-order. Layers 6–7 are global policy + gold-standard print spec.

## 2. Templates are data, not code

Templates live in `prompts/templates/*.json` as structured fragments with typed
slots. They are **filled**, not evaluated — no code executes inside a template.

```jsonc
// prompts/templates/scene.template.json (illustrative)
{
  "id": "scene.cinematic.landscape",
  "version": "1.0.0",
  "layers": ["style", "composition", "productVoice", "subject", "photoConditioning", "negatives", "output"],
  "slots": {
    "style":       "{{goldStandard.styleConstitution}}",
    "composition": "{{goldStandard.compositionContract}}",
    "productVoice":"{{adapter.promptFragments.voice}}",
    "subject":     "{{inputs.rendered}}",
    "negatives":   "{{policy.negatives}} {{adapter.promptFragments.negatives}}",
    "output":      "{{goldStandard.printContract}}"
  }
}
```

## 3. Determinism & pinning

Every generated prompt is emitted as a **prompt bundle** that records exactly what
produced it, so it can be reproduced or diffed:

```jsonc
{
  "promptBundleId": "pb_...",
  "template":     { "id": "scene.cinematic.landscape", "version": "1.0.0" },
  "goldStandard": { "id": "premium-cinematic-landscape", "version": "1.0.0" },
  "adapter":      { "id": "team", "version": "1.0.0" },
  "inputsHash":   "sha256:...",     // customer inputs, normalized
  "seed":         1234567890,        // deterministic per job
  "model":        { "backend": "scene", "target": "unset-in-architecture-milestone" },
  "composedAt":   "<stamped by runtime, not in this milestone>",
  "text":         { "positive": "…", "negative": "…" }
}
```

`seed` is derived deterministically from `jobId + promptBundle version` so retries
reproduce (or intentionally perturb) results predictably.

## 4. Guardrails baked into every prompt (layer 6)

- **No licensed content** — no team/brand logos, no player likenesses, no
  copyrighted characters (aligns with the existing Champions/Team rule).
- **No synthetic text** — headline/name/footer text is composited deterministically
  by the `compositor`, never "drawn" by the image model (avoids garbled type).
- **Identity integrity** — the customer's hero face must not be altered/replaced;
  the model conditions on the cutout, it does not invent a person.
- **Print safety** — palette constrained to CMYK-safe gamut; nothing critical in
  the bleed; contrast floor for legibility.

## 5. Separation of concerns

| Concern | Owned by | Never in |
|---------|----------|----------|
| How it should *look* | Gold Standard (layers 1–2, 7) | Adapter |
| What it should *say / mean* | Adapter (layer 3) | Gold Standard |
| Who / which photos | Customer inputs (layers 4–5) | Templates |
| What's forbidden | Policy + adapter negatives (layer 6) | — |

This is why a new product needs only a new adapter: it supplies layer 3 (+ its
negatives) and binds to an existing gold standard for everything visual.
