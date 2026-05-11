/**
 * Canonical, versioned schema for RenderInput.
 *
 * This is the contract between the frontend (live preview) and the backend
 * (HD render + payment unlock + signed downloads). Both sides validate every
 * payload against this schema. Old payloads stored in Postgres are migrated
 * on read by `migrateRenderInput()`.
 *
 * Photos here only carry URL + metadata — never raw image data. The render
 * engine fetches/decodes them lazily based on environment.
 */

import { z } from 'zod';
import { RENDER_INPUT_VERSION } from '@celebratebanner/render-engine';

// ── Primitives ───────────────────────────────────────────────────────────────
export const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be #RRGGBB');

export const PaletteSchema = z.object({
  bg: HexColor,
  accent: HexColor,
  text: HexColor,
});

export const ThemeSchema = z.object({
  id: z.string().min(1).max(64),
  fields: z.array(z.string().min(1).max(48)).min(1).max(8),
  fieldMeta: z
    .record(
      z.string(),
      z.object({ label: z.string().optional(), placeholder: z.string().optional() }),
    )
    .optional(),
  palette: PaletteSchema,
});

// Stored photo — URL points at the S3 object. We never persist image bytes.
export const PhotoMetaSchema = z.object({
  id: z.string().min(1).max(64),
  url: z.string().url(),
  /** Natural dimensions, captured at upload time. */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Computed DPI (used to surface "low-res" warnings). */
  dpi: z.number().int().nonnegative().optional(),
  /** Original byte size for analytics + abuse detection. */
  bytes: z.number().int().nonnegative().optional(),
  /** Optional sha256 of the file body for idempotency. */
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});
export type PhotoMeta = z.infer<typeof PhotoMetaSchema>;

export const ArrangementIdSchema = z.enum(['classic', 'magazine', 'pyramid', 'scattered', 'mosaic']);
export const FrameIdSchema = z.enum([
  'rounded', 'circle', 'polaroid', 'gold', 'hexagon',
  'diamond', 'scallop', 'vintage', 'tape', 'neon',
  'baroque', 'shadow-box', 'glitter', 'ribbon', 'crown',
  'white', 'shadow', 'double-gold', 'heart', 'star',
]);

// ── Canonical RenderInput (v1) ───────────────────────────────────────────────
export const RenderInputV1Schema = z.object({
  /** Schema version stamp. Always present on persisted payloads. */
  version: z.literal(1),
  /** Owner project id. Echoed back on every API call so we can audit-log. */
  projectId: z.string().regex(/^proj_[a-zA-Z0-9_-]{6,32}$/),
  /** Banner pixel size for the preview pass. HD path overrides via ExportOptions. */
  width: z.number().int().min(400).max(8000).default(800),
  height: z.number().int().min(600).max(12000).default(1200),
  arrangement: ArrangementIdSchema,
  theme: ThemeSchema,
  bannerText: z.record(z.string(), z.string().max(120)).default({}),
  photos: z.array(PhotoMetaSchema).min(1).max(50),
  heroId: z.string().min(1).max(64).nullable(),
  frames: z.record(z.string(), FrameIdSchema).default({}),
  defaultFrame: FrameIdSchema.default('rounded'),
  rotations: z.record(z.string(), z.number().int().min(0).max(360)).default({}),
  /** Deterministic seed — same seed → same jitter / shuffle. */
  seed: z.number().int().min(0).max(2 ** 31 - 1).default(12345),
  cinematicHero: z.boolean().default(true),
});

export type RenderInputV1 = z.infer<typeof RenderInputV1Schema>;

// Public type. We only ever export the latest version's type — callers shouldn't
// have to switch on `version` at every use site.
export type RenderInputCanonical = RenderInputV1;

// ── Migration ────────────────────────────────────────────────────────────────
/**
 * Lift any historical payload into the current canonical shape. The function
 * accepts unknown so it's safe to call directly on `JSON.parse(row.payload)`.
 *
 * Today there's only one version; this is where v1→v2 lives once we ship it.
 */
export function migrateRenderInput(raw: unknown): RenderInputV1 {
  if (raw && typeof raw === 'object' && (raw as { version?: number }).version === RENDER_INPUT_VERSION) {
    return RenderInputV1Schema.parse(raw);
  }
  if (raw && typeof raw === 'object' && !(raw as { version?: number }).version) {
    // Pre-versioning payload: stamp v1 and hope the rest validates.
    return RenderInputV1Schema.parse({ ...(raw as object), version: RENDER_INPUT_VERSION });
  }
  // Future: if (raw.version === 2) migrate v2 → vN here.
  throw new Error(`Unsupported render-input version: ${(raw as { version?: unknown })?.version}`);
}

// ── Serialization helpers ────────────────────────────────────────────────────
/**
 * Build a fresh RenderInput from in-memory state. Returns a validated payload
 * ready to POST to the backend or stash in localStorage.
 */
export function buildRenderInput(input: Omit<RenderInputV1, 'version'>): RenderInputV1 {
  return RenderInputV1Schema.parse({ version: RENDER_INPUT_VERSION, ...input });
}

/** Safe JSON encode for storage / network transport. */
export function serializeRenderInput(input: RenderInputV1): string {
  return JSON.stringify(input);
}

/** Safe JSON decode + migration + validation in one step. */
export function deserializeRenderInput(blob: string): RenderInputV1 {
  return migrateRenderInput(JSON.parse(blob));
}
