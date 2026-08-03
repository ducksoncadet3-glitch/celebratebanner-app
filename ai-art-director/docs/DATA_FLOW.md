# Data Flow — AI Art Director

**Deliverable #3.** How a single order moves from customer inputs to an
approved, print-ready keepsake.

## 1. End-to-end pipeline (flowchart)

```mermaid
flowchart LR
  IN["Customer inputs\n(photos + product + text + colors)"] --> API[Intake API\nvalidate]
  API -->|enqueue job| Q1[(jobs queue)]
  Q1 --> ORCH[Orchestrator]

  ORCH --> A[AssetService\nnormalize photos:\norientation · color space ·\nresolution · dedupe]
  ORCH --> G[GoldStandardLoader\npin visual DNA vX]
  ORCH --> D[AdapterLoader\npin product adapter vY]

  A & G & D --> P[PromptBuilder\ncompose + pin\nprompt bundle vZ]

  P --> GEN{GeneratorClient}
  GEN --> HC[hero cutout]
  GEN --> SC[scene / atmosphere]
  GEN --> CMP[compositor\n300 DPI · geometry · text]
  GEN -. fallback .-> BR[browser renderer\n(existing, read-only)]

  HC & SC & CMP --> CAND["candidate artwork\n+ manifest"]
  CAND --> QA{QAService gates}
  QA -->|fail| RETRY[retry / regen\nor fallback]
  RETRY --> GEN
  QA -->|pass| Q2[(review queue)]
  Q2 --> REV["ReviewService\nautomated summary +\nHUMAN approval"]
  REV -->|reject| RETRY
  REV -->|approve| STORE[StorageService\ncontent-addressed]
  STORE --> OUT["outputs/:\nweb preview · print JPG ·\nprint PDF · manifest"]
  OUT --> CB["CallbackService\nartwork-approved event"]
  CB -. read-only handoff .-> FUL["existing fulfillment /\nconcierge (unchanged)"]
```

## 2. Sequence (happy path)

```mermaid
sequenceDiagram
  participant C as Customer/Order system
  participant API as Intake API
  participant O as Orchestrator
  participant PB as PromptBuilder
  participant GEN as GeneratorClient
  participant QA as QAService
  participant R as ReviewService (human)
  participant S as StorageService

  C->>API: submit job (photos, product, inputs, idempotencyKey)
  API->>API: validate + assign jobId
  API-->>C: 202 Accepted {jobId}
  API->>O: enqueue(job)
  O->>PB: build(goldStandard@vX, adapter@vY, inputs)
  PB-->>O: promptBundle@vZ (pinned, deterministic seed)
  O->>GEN: generate(promptBundle, assets)
  GEN-->>O: candidate + manifest
  O->>QA: evaluate(candidate)
  QA-->>O: verdict(pass, scores)
  O->>R: request review(candidate, verdict)
  R-->>O: approved
  O->>S: store(approved outputs + manifest)
  S-->>O: outputRefs (web/jpg/pdf)
  O-->>C: webhook artwork.approved {jobId, outputRefs}
```

## 3. Pipeline states

`RECEIVED → NORMALIZING → PROMPTING → GENERATING → QA → REVIEW → APPROVED → STORED → DELIVERED`

Terminal/branch states: `QA_FAILED`, `REVIEW_REJECTED`, `RETRYING`, `FELL_BACK`
(browser renderer used), `FAILED` (dead-letter), `CANCELLED`.

State transitions, retry rules, and idempotency are specified in `ERROR_HANDLING.md`.

## 4. What crosses the boundary to production (only this)

- **In:** a read-only copy of the customer's uploaded photos + the product/inputs
  (the same data concierge capture already stores). No checkout/Stripe coupling.
- **Out:** an `artwork.approved` (or `artwork.failed`) event with output references.
  The existing fulfillment picks these up **read-only**; no checkout, pricing, or
  concierge code is modified.

Everything else stays inside `ai-art-director/`.
