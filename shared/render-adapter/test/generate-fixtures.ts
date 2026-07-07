/**
 * Regenerates RenderedConcept snapshot fixtures. Runs the FULL pipeline from the
 * upstream Memory Profile + Creative Brief + WOWPresentation fixtures through the
 * orchestrator, then through the adapter with the deterministic stub renderer.
 * Run:  npm run fixtures
 * Deterministic — safe to commit and snapshot-test against.
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateRenderPlan } from '../../render-orchestrator/src/index.ts';
import type { MemoryProfile, CreativeBrief, WowPresentation } from '../../render-orchestrator/src/types.ts';
import { renderConcept } from '../src/index.ts';
import { createStubRenderer } from './stub-renderer.ts';

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
  const rendered = renderConcept(plan, createStubRenderer());
  writeFileSync(join(outDir, `${key}.json`), `${JSON.stringify(rendered, null, 2)}\n`);
  console.log(
    `${key.padEnd(13)} concept=${rendered.conceptName.padEnd(18)} status=${rendered.renderStatus.padEnd(9)} ` +
    `targets=${rendered.exportTargets.length} preview=${rendered.previewImage?.widthPx}x${rendered.previewImage?.heightPx} ` +
    `passed=${rendered.qualityChecks.passed}`,
  );
}
