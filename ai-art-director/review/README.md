# review/

**The human-approval gate + audit trail.** No AI artwork reaches a customer without
passing automated QA **and** a human approval. See `../docs/REVIEW_WORKFLOW.md`.

- `review-record.schema.json` — the audit record for every review: job id, candidate
  ref, QA scorecard, pinned versions + seed, reviewer, decision, notes, timestamps.

The human step reuses the established owner-review pattern (zoom / fit / fullscreen /
guides that never export), read-only over production and not customer-facing.

**Never here:** customer-facing UI, checkout code, or anything that mutates production.
