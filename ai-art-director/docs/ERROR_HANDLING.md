# Error Handling & Retry Strategy

**Deliverable #10.** How the pipeline stays correct and always fulfillable under
failure. The governing rule: **an order must always be deliverable**, so the existing
browser renderer is the guaranteed fallback for any unrecoverable AI-path failure.

## 1. Failure classes & responses

| Class | Examples | Response |
|-------|----------|----------|
| **Transient** | timeout, rate limit, 5xx from a backend | retry w/ backoff |
| **Quality** | QA gate fail, review changes-requested | regenerate (new seed/inputs), bounded attempts |
| **Input** | corrupt/too-low-DPI photo, missing required field | reject early, return actionable error to intake |
| **Policy** | safety/identity gate hard-stop | stop → human; never auto-retry around a safety block |
| **Systemic** | backend down, repeated failures | circuit breaker → fall back to browser renderer |
| **Fatal** | exhausted retries, poison message | dead-letter queue + fall back / human |

## 2. Retry policy (transient)

- **Exponential backoff with jitter**: e.g. base 2s, factor 2, max 60s, cap **5**
  attempts per stage.
- **Idempotent stages only.** Each stage keyed by `jobId + stage + attempt` so a
  retried stage never double-produces or double-charges (there is no charging here —
  checkout is untouched).
- **Deterministic seeds** mean a retried generation reproduces unless we intentionally
  perturb the seed for a *quality* retry.
- Retries are **bounded**; exceeding the cap escalates to the next class (systemic/fatal).

## 3. Quality retries (bounded regeneration)

```
attempt 1: seed = seed0
attempt 2: seed = seed0 + 1        (perturb)
attempt 3: adjust inputs per review notes, seed = seed0 + 2
after N (default 3): stop → human review → FALLBACK to browser renderer
```

Quality retries are separate from transient retries and have their own smaller cap,
so we never loop forever chasing a WOW score.

## 4. Circuit breaker (systemic)

Per generator backend:

```
CLOSED  ──(failures ≥ threshold in window)──▶ OPEN ──▶ route new jobs to FALLBACK
  ▲                                             │
  └──────(probe succeeds)── HALF_OPEN ◀─────────┘ (after cool-down, send 1 probe)
```

While a backend is **OPEN**, the orchestrator routes jobs to the **browser renderer**
so fulfillment continues uninterrupted. The breaker auto-probes and recovers.

## 5. Fallback to the existing renderer (the safety net)

Triggered by: exhausted retries, open circuit breaker, review rejection, or any
unhandled AI-path error.

- The order is rendered by the **existing Premium Cinematic browser renderer**,
  read-only and unmodified — the exact path customers use today.
- The job is marked `FELL_BACK`; the `artwork.failed` webhook carries
  `fellBackToBrowserRenderer: true` so fulfillment knows which asset to use.
- **Net effect: the AI path can never block or degrade a sale.**

## 6. Dead-letter queue (fatal)

Poison messages / exhausted jobs land in `jobs.dlq` with full context (error, stack,
attempts, pinned versions). DLQ items are for human triage and never auto-retried.
An alert notifies the owner. The associated order still ships via fallback.

## 7. Timeouts & budgets

| Stage | Soft budget | On exceed |
|-------|-------------|-----------|
| Normalize | 15s | retry once → fail-fast |
| Prompt build | 2s | fail-fast (deterministic; slowness = bug) |
| Generate | 60s | retry/backoff → breaker |
| QA | 20s | retry once → human |
| Review | human-paced | reminder + escalate, no auto-timeout to reject |

These mirror the app's render-time targets (preview ≤30s, final ≤60s).

## 8. Observability

Every transition, retry, breaker flip, and fallback is logged to the review/audit
record with `jobId`, stage, attempt, and pinned versions — so any outcome is
explainable and reproducible. No metrics backend is provisioned in this milestone; the
contracts define *what* is recorded, not a live sink.

## 9. Guarantees (summary)

1. No customer ever receives un-reviewed AI artwork.
2. No failure can make an order unfulfillable — browser renderer is always available.
3. No retry double-produces (idempotent, keyed stages).
4. Safety/identity failures never auto-retry; they escalate to a human.
5. Every output is reproducible from its manifest.
