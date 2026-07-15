# adapters/

**Per-product content packs.** Wording, decorations, fields, footer values,
photo-slot meanings, and prompt fragments — everything product-specific. Each binds
to a gold standard for the look. See `../docs/ADAPTER_SPEC.md`.

- `<product>/schema.json` — JSON Schema for that product's adapter.
- `<product>/vN.json` — a published, immutable adapter version.

Design targets: `graduation/`, `team/`, `wedding/`, `family-legacy/`, `memorial/`,
`patriotic/`, and future products. Adding a product = adding an adapter folder; no
pipeline or gold-standard changes.

**Never here:** geometry, lighting, print spec (those belong to the gold standard),
licensed logos/likenesses, or runtime code.
