# API Interfaces

**Deliverable #9.** The contracts by which the pipeline is driven and observed. These
are **interface definitions only** — no server, no handlers, no external calls exist in
this milestone. Typed forms live in `services/contracts.ts`, `queues/message-schemas.ts`,
and `generators/contracts.ts` (interfaces/types only, no runtime logic).

## 1. REST (Intake API) — illustrative

All async: submit returns a job id; poll or receive a webhook.

### `POST /v1/jobs` — submit a job
```jsonc
// request
{
  "product": "team",                       // adapter id
  "idempotencyKey": "order_9f3a…",         // dedupe; same key ⇒ same job
  "inputs": {                              // validated against the adapter's fields
    "teamName": "Riverside Rockets",
    "sport": "basketball",
    "season": "2025–26",
    "colors": ["#0B3D91", "#FFFFFF"]
  },
  "photos": [                              // references, not bytes
    { "role": "hero", "ref": "upload://…", "sha256": "…" },
    { "role": "supporting", "ref": "upload://…", "sha256": "…" }
  ]
}
// response 202
{ "jobId": "job_…", "status": "RECEIVED", "pollUrl": "/v1/jobs/job_…" }
```

### `GET /v1/jobs/{jobId}` — status
```jsonc
{ "jobId": "job_…", "status": "REVIEW", "state": "IN_REVIEW",
  "qa": { "passed": true, "wowScore": 0.86 },
  "candidatePreview": "…", "updatedAt": "…" }
```

### `GET /v1/jobs/{jobId}/result` — final outputs (when APPROVED)
```jsonc
{ "jobId": "job_…", "status": "APPROVED",
  "outputs": { "webPreview": "…", "printJpg": "…", "printPdf": "…" },
  "manifest": "…" }
```

### `POST /v1/jobs/{jobId}/cancel` — cancel if not yet delivered

### Webhooks (pipeline → ordering system)
- `artwork.approved` → `{ jobId, outputs, manifest }`
- `artwork.failed`   → `{ jobId, reason, fellBackToBrowserRenderer: true|false }`

The webhook is a **read-only handoff**; it does not modify checkout, Stripe, pricing,
or concierge — the existing fulfillment consumes the event.

## 2. Queue messages (internal)

Schemas in `queues/message-schemas.ts`. One topic per stage; the orchestrator moves
jobs across them.

| Topic | Payload (summary) |
|-------|-------------------|
| `jobs.received` | jobId, product, inputs, photos, idempotencyKey |
| `jobs.normalized` | jobId, normalized asset refs |
| `jobs.prompted` | jobId, promptBundleId |
| `jobs.generated` | jobId, candidateRef, manifestDraft |
| `jobs.qa` | jobId, verdict |
| `jobs.review` | jobId, reviewRecordId |
| `jobs.approved` / `jobs.failed` | jobId, outputs | reason |
| `jobs.dlq` | jobId, error, attempts (dead-letter) |

## 3. Service interfaces (internal boundaries)

Typed in `services/contracts.ts`. Each is a pure interface:

```ts
// illustrative — interface only, no implementation in this milestone
export interface GoldStandardLoader { resolve(id: string, version: string): Promise<GoldStandard>; }
export interface AdapterLoader      { resolve(id: string, version: string): Promise<Adapter>; }
export interface PromptBuilder      { build(gs: GoldStandard, ad: Adapter, inputs: JobInputs): Promise<PromptBundle>; }
export interface GeneratorClient    { generate(bundle: PromptBundle, assets: NormalizedAssets): Promise<Candidate>; }
export interface QAService          { evaluate(c: Candidate): Promise<QaVerdict>; }
export interface ReviewService      { submit(c: Candidate, v: QaVerdict): Promise<ReviewRecord>; decide(id: string, d: ReviewDecision): Promise<ReviewRecord>; }
export interface StorageService     { put(a: Artifact): Promise<Ref>; get(ref: Ref): Promise<Artifact>; }
export interface CallbackService    { emit(event: ArtworkEvent): Promise<void>; }
```

## 4. Generator boundary (pluggable backends)

Typed in `generators/contracts.ts`. Every backend — including the existing
**browser renderer used as a read-only fallback** — implements the same interface, so
the orchestrator is backend-agnostic:

```ts
export type GeneratorBackend = "browser-renderer" | "bg-removal" | "scene" | "compositor";
export interface Generator {
  readonly backend: GeneratorBackend;
  generate(bundle: PromptBundle, assets: NormalizedAssets): Promise<Candidate>;
}
```

## 5. Conventions

- **Versioned path prefix** (`/v1`) so the contract can evolve without breaking callers.
- **Idempotency keys** on submit; **content hashes** on every asset.
- **No secrets in this milestone** — no keys, endpoints, or SDKs are configured.
- Everything above is a design contract; nothing here executes work yet.
