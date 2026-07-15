# Versioning Strategy

**Deliverable #8.** Every keepsake must be reproducible and explainable. This is
achieved by pinning and versioning every input to generation.

## 1. What is versioned

| Artifact | Scheme | Location |
|----------|--------|----------|
| Gold Standard (visual DNA) | SemVer `MAJOR.MINOR.PATCH` | `gold-standards/<id>/vN.json` |
| Product Adapter | SemVer | `adapters/<id>/vN.json` |
| Prompt template | SemVer | `prompts/templates/*.json` |
| Policy / QA thresholds | SemVer | pipeline config |
| Generator backend + model | id + model tag + params hash | recorded in manifest |
| Pipeline (the module itself) | `package.json` version | `ai-art-director/package.json` |

## 2. SemVer meaning here

- **PATCH** — non-visual fixes (typo in a motto, metadata). Safe to auto-adopt.
- **MINOR** — additive (new footer icon option, new field) that doesn't change
  existing outputs. Backward compatible.
- **MAJOR** — anything that changes the *look* of already-produced artwork (grid
  moves, lighting rule change, palette-rule change). Requires re-review; never
  silently applied to in-flight or past orders.

**Immutability:** a published version is never edited. Changes ship as a new version.
`vN.json` files are append-only.

## 3. The manifest (per output) — the reproducibility record

Every generated output carries a manifest pinning exactly what produced it:

```jsonc
{
  "manifestVersion": "1.0.0",
  "jobId": "job_...",
  "product": "team",
  "pinned": {
    "goldStandard": { "id": "premium-cinematic-landscape", "version": "1.0.0" },
    "adapter":      { "id": "team", "version": "1.0.0" },
    "promptTemplate": { "id": "scene.cinematic.landscape", "version": "1.0.0" },
    "promptBundleId": "pb_...",
    "policy":       { "version": "1.0.0" },
    "generator":    { "backend": "scene", "model": "unset-in-architecture-milestone", "paramsHash": "sha256:…" },
    "seed":         1234567890,
    "inputsHash":   "sha256:…"
  },
  "pipelineVersion": "0.1.0-architecture",
  "outputs": { "webPreview": "…", "printJpg": "…", "printPdf": "…" },
  "createdAt": "<stamped by runtime>"
}
```

Schema: `outputs/manifest.schema.json`. Given a manifest, the same inputs + versions
+ seed reproduce (or deterministically perturb) the artwork.

## 4. Compatibility & migration

- Adapters **bind** to a gold-standard `{id, version}`. A gold-standard MAJOR bump
  does **not** auto-migrate adapters; each adapter re-binds explicitly after re-review.
- Old orders keep their pinned versions forever (manifests are immutable). Upgrading
  the gold standard never alters previously delivered keepsakes.
- New versions roll out via the same **shadow → assisted → opt-in → default** path as
  the pipeline itself (see `ARCHITECTURE.md` §5), so visual changes are always
  reviewed before customers see them.

## 5. Deprecation

A version may be marked `deprecated` (still resolvable for reproducing old orders) or
`retired` (no new jobs). Neither deletes artifacts — historical manifests must always
resolve.
