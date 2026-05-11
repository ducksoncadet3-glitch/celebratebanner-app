/**
 * Server-side RenderInput validation + migration.
 *
 * Mirrors web/lib/render-input.schema.ts. Once you publish the shared engine
 * as an npm package, both sides can import the same Zod schema. Until then,
 * keep these two files in lockstep manually.
 *
 * Dependencies:
 *   "zod": "^3.23.8"
 */

const { z } = require('zod');

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const PaletteSchema = z.object({ bg: HexColor, accent: HexColor, text: HexColor });
const ThemeSchema = z.object({
  id: z.string().min(1).max(64),
  fields: z.array(z.string().min(1).max(48)).min(1).max(8),
  fieldMeta: z.record(z.string(), z.object({ label: z.string().optional(), placeholder: z.string().optional() })).optional(),
  palette: PaletteSchema,
});
const PhotoMetaSchema = z.object({
  id: z.string().min(1).max(64),
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  dpi: z.number().int().nonnegative().optional(),
  bytes: z.number().int().nonnegative().optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

const RenderInputV1Schema = z.object({
  version: z.literal(1),
  projectId: z.string().regex(/^proj_[a-zA-Z0-9_-]{6,32}$/),
  width: z.number().int().min(400).max(8000).default(800),
  height: z.number().int().min(600).max(12000).default(1200),
  arrangement: z.enum(['classic', 'magazine', 'pyramid', 'scattered', 'mosaic']),
  theme: ThemeSchema,
  bannerText: z.record(z.string(), z.string().max(120)).default({}),
  photos: z.array(PhotoMetaSchema).min(1).max(50),
  heroId: z.string().min(1).max(64).nullable(),
  frames: z.record(z.string(), z.string()).default({}),
  defaultFrame: z.string().default('rounded'),
  rotations: z.record(z.string(), z.number().int().min(0).max(360)).default({}),
  seed: z.number().int().min(0).max(2 ** 31 - 1).default(12345),
  cinematicHero: z.boolean().default(true),
});

function deserializeRenderInput(raw) {
  if (raw && typeof raw === 'string') raw = JSON.parse(raw);
  if (raw && typeof raw === 'object' && raw.version === 1) {
    return RenderInputV1Schema.parse(raw);
  }
  if (raw && typeof raw === 'object' && !raw.version) {
    // Legacy / pre-versioning payload: stamp v1 and validate.
    return RenderInputV1Schema.parse({ ...raw, version: 1 });
  }
  throw new Error(`Unsupported render-input version: ${raw?.version}`);
}

module.exports = { RenderInputV1Schema, deserializeRenderInput };
