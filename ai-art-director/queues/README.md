# queues/

**Async pipeline message contracts — schemas only, NO broker.** One topic per stage;
the orchestrator moves jobs across them. See `message-schemas.ts` and
`../docs/API_INTERFACES.md` §2.

Topics: `jobs.received → jobs.normalized → jobs.prompted → jobs.generated → jobs.qa
→ jobs.review → jobs.approved | jobs.failed`, plus `jobs.dlq` (dead-letter).

**Never here:** broker configuration, credentials, or running consumers. `*.ts`
files define message shapes only — no runtime logic.
