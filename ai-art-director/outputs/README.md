# outputs/

**Runtime artifact landing zone — git-ignored.** Generated candidates, approved
web previews, print JPG/PDF, and their manifests are written here at runtime.

- `manifest.schema.json` — the reproducibility record every output carries
  (pinned gold standard + adapter + prompt + seed + generator). See
  `../docs/VERSIONING.md` §3.
- Everything else in this folder is generated and **git-ignored** (`.gitignore`).

**Never committed:** customer photos, generated artwork, or manifests for real
orders. Only the schema is tracked. Nothing is produced in this milestone.
