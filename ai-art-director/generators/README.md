# generators/

**Pluggable generation backends — typed boundary only, NO implementation.** Every
backend implements the same `Generator` interface so the orchestrator is
backend-agnostic. See `contracts.ts` and `../docs/API_INTERFACES.md` §4.

Planned backends (interfaces only in this milestone):
- `browser-renderer` — the **existing** Premium Cinematic canvas renderer, invoked
  read-only as the deterministic **fallback** / baseline. Never modified.
- `bg-removal` — hero cutout.
- `scene` — cinematic background / atmosphere.
- `compositor` — deterministic 300 DPI assembly (geometry + text + print spec).

**Never here:** external AI API calls, keys/SDKs, or any code that executes
generation work. `*.ts` files are type/interface contracts only.
