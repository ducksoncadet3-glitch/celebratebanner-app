/**
 * Regenerates ../fixtures/<key>.json by running generateCreativeBrief() on the
 * committed Memory Profile fixtures. Run after intentional engine changes:
 *   node test/generate-fixtures.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateCreativeBrief } from '../src/index.ts';
import type { MemoryProfile } from '../src/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const mpFixtures = join(here, '..', '..', 'memory-profile', 'fixtures');
const outDir = join(here, '..', 'fixtures');

const KEYS = ['graduation', 'championship', 'family', 'wedding', 'memorial'];

for (const key of KEYS) {
  const profile = JSON.parse(readFileSync(join(mpFixtures, `${key}.json`), 'utf8')) as MemoryProfile;
  const brief = generateCreativeBrief(profile);
  const path = join(outDir, `${key}.json`);
  writeFileSync(path, JSON.stringify(brief, null, 2) + '\n', 'utf8');
  console.log(`wrote ${path}`);
}
