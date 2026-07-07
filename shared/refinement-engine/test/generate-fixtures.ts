/**
 * Regenerates RefinedConcept snapshot fixtures from the committed graduation
 * Memory Profile + Creative Brief + WOWPresentation. Run:  npm run fixtures
 * Deterministic — safe to commit and snapshot-test against.
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { refineConcept } from '../src/index.ts';
import type { WowConcept, CreativeBrief, MemoryProfile } from '../src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const load = (rel: string) => JSON.parse(readFileSync(join(here, '..', '..', rel), 'utf8'));
const outDir = join(here, '..', 'fixtures');
mkdirSync(outDir, { recursive: true });

const wp = load('wow-engine/fixtures/graduation.json');
const cb: CreativeBrief = load('creative-brief/fixtures/graduation.json');
const mp: MemoryProfile = load('memory-profile/fixtures/graduation.json');
const concept: WowConcept = wp.concepts.find((c: WowConcept) => c.conceptName === wp.recommendedConcept);

const SCENARIOS: Record<string, string> = {
  luxury: 'make it feel more luxurious and opulent',
  elegance: 'more elegant and refined',
  modern: 'give it a modern editorial feel',
  classic: 'make it more classic and timeless',
  minimal: 'cleaner and more minimal',
  celebration: 'make it more festive and celebratory',
  'hero-emphasis': 'make the hero bigger and emphasize the main photo',
  typography: 'refine the typography and headline',
  color: 'warmer, more harmonious colors',
  decoration: 'add a little decoration',
  lighting: 'add a soft spotlight and glow',
  emotion: 'make it more heartfelt and moving',
  background: 'deepen the background',
  energy: 'more energy and punch',
  'combo-luxury-hero': 'more luxurious with a bigger hero',
  'reject-conflict': 'more modern but also very classic',
  'reject-toomany': 'more luxury, more modern, more energy, and more emotion',
  'reject-hero-reduce': 'make the hero smaller',
  'reject-unrecognized': 'asdfjkl please do something',
};

for (const [name, instruction] of Object.entries(SCENARIOS)) {
  const refined = refineConcept(concept, instruction, cb, mp);
  writeFileSync(join(outDir, `${name}.json`), `${JSON.stringify(refined, null, 2)}\n`);
  console.log(`${name.padEnd(20)} ${refined.accepted ? 'ACCEPT' : 'REJECT'}  ${refined.previousWowScore}->${refined.wowScore}  intents=[${refined.intents.join(',')}]`);
}
