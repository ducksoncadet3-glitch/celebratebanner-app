/**
 * Regenerates ../fixtures/<key>.json from the scenarios in scenarios.ts.
 * Run after intentional engine changes:  node test/generate-fixtures.ts
 * The generated fixtures are snapshot-compared by memoryProfile.test.ts.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateMemoryProfile } from '../src/index.ts';
import { scenarios } from './scenarios.ts';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '..', 'fixtures');

for (const s of scenarios) {
  const profile = generateMemoryProfile(s.photos, s.options);
  const path = join(fixturesDir, `${s.key}.json`);
  writeFileSync(path, JSON.stringify(profile, null, 2) + '\n', 'utf8');
  console.log(`wrote ${path}`);
}
