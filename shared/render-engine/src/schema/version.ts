/**
 * RenderInput schema version. Bump this whenever the canonical shape of
 * RenderInput changes in a breaking way. Old payloads stored in the DB are
 * migrated by `migrateRenderInput()` (web/lib/render-input.schema.ts) on read.
 *
 * Versioning policy:
 *   • Additive changes (new optional field) → bump nothing. Old payloads load fine.
 *   • Field renamed / required field added / shape changed → bump major.
 *   • Once a version is shipped to prod, NEVER reuse it. Add a new one.
 */
export const RENDER_INPUT_VERSION = 1 as const;
export type RenderInputVersion = typeof RENDER_INPUT_VERSION;
