/**
 * Regenerates the WOWPresentation snapshot fixtures from the upstream
 * Memory Profile + Creative Brief fixtures. Run:  npm run fixtures
 * Deterministic — safe to commit and snapshot-test against.
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateWOWPresentation } from '../src/index.ts';
import type { MemoryProfile, CreativeBrief } from '../src/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const mpDir = join(here, '..', '..', 'memory-profile', 'fixtures');
const cbDir = join(here, '..', '..', 'creative-brief', 'fixtures');
const outDir = join(here, '..', 'fixtures');
mkdirSync(outDir, { recursive: true });

const KEYS = ['graduation', 'championship', 'family', 'wedding', 'memorial'];

for (const key of KEYS) {
  const profile: MemoryProfile = JSON.parse(readFileSync(join(mpDir, `${key}.json`), 'utf8'));
  const brief: CreativeBrief = JSON.parse(readFileSync(join(cbDir, `${key}.json`), 'utf8'));
  const presentation = generateWOWPresentation(profile, brief);
  writeFileSync(join(outDir, `${key}.json`), `${JSON.stringify(presentation, null, 2)}\n`);
  const scores = presentation.concepts.map((c) => `${c.conceptName.split(' ')[0]}:${c.wowScore}`).join(' ');
  console.log(`${key.padEnd(13)} overall=${presentation.overallWOWScore} pass=${presentation.masterpiecePassed}  [${scores}]`);
}
