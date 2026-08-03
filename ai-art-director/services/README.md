# services/

**Service boundaries — typed contracts only, NO implementation.** Each service is a
pure interface; the orchestrator composes them. See `contracts.ts` and
`../docs/API_INTERFACES.md` §3.

Services: Intake API · Orchestrator · AssetService · GoldStandardLoader ·
AdapterLoader · PromptBuilder · GeneratorClient · QAService · ReviewService ·
StorageService · CallbackService.

**Never here:** external AI calls, keys/SDKs, network handlers, or executing logic.
`*.ts` files declare interfaces/types only — no function bodies that do work.
