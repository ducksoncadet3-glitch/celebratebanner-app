/**
 * Regenerates RenderPlan snapshot fixtures from the upstream Memory Profile +
 * Creative Brief + WOWPresentation fixtures. Run:  npm run fixtures
 * Deterministic — safe to commit and snapshot-test against.
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateRenderPlan } from '../src/index.ts';
import type { MemoryProfile, CreativeBrief, WowPresentation } from '../src/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const mpDir = join(here, '..', '..', 'memory-profile', 'fixtures');
const cbDir = join(here, '..', '..', 'creative-brief', 'fixtures');
const wpDir = join(here, '..', '..', 'wow-engine', 'fixtures');
const outDir = join(here, '..', 'fixtures');
mkdirSync(outDir, { recursive: true });

const KEYS = ['graduation', 'championship', 'family', 'wedding', 'memorial'];
const load = (dir: string, key: string) => JSON.parse(readFileSync(join(dir, `${key}.json`), 'utf8'));

for (const key of KEYS) {
  const mp: MemoryProfile = load(mpDir, key);
  const cb: CreativeBrief = load(cbDir, key);
  const wp: WowPresentation = load(wpDir, key);
  const plan = generateRenderPlan(mp, cb, wp);
  writeFileSync(join(outDir, `${key}.json`), `${JSON.stringify(plan, null, 2)}\n`);
  console.log(`${key.padEnd(13)} concept=${plan.conceptName.padEnd(18)} arrangement=${plan.renderInstructions.arrangement.padEnd(9)} accepted=${plan.accepted} targets=${plan.exportTargets.length}`);
}
