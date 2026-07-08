/**
 * Sprint 6 — Integration Demo tests. Node's built-in runner:
 *   node --test 'test/*.test.ts'
 *
 * These exercise the demo's live pipeline (the same code the browser demo runs)
 * and guard that no production files were touched.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runPipeline, renderPlanForConcept } from '../demo/pipeline.ts';
import type { MemoryProfile, PipelineResult } from '../demo/pipeline.ts';

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = join(here, '..');
const mpDir = join(componentsDir, '..', 'shared', 'memory-profile', 'fixtures');

const KEYS = ['graduation', 'championship', 'family', 'wedding', 'memorial'] as const;
type Key = (typeof KEYS)[number];
const CONCEPTS = ['Signature Edition', 'Luxury Gold', 'Family Legacy', 'Modern Editorial'] as const;

const loadProfile = (k: Key): MemoryProfile => JSON.parse(readFileSync(join(mpDir, `${k}.json`), 'utf8'));
const run = (k: Key): PipelineResult => runPipeline(loadProfile(k));

// ── all fixtures load + the full pipeline composes ───────────────────
for (const k of KEYS) {
  test(`[${k}] Memory Profile fixture loads`, () => {
    const mp = loadProfile(k);
    assert.equal(mp.occasion, k === 'family' ? 'family_reunion' : k);
    assert.ok(mp.hero_photo);
  });
  test(`[${k}] full pipeline produces all four stage outputs`, () => {
    const r = run(k);
    assert.ok(r.memoryProfile && r.creativeBrief && r.wowPresentation && r.renderPlan);
    assert.ok(r.creativeBrief.recommendedConcept);
  });
  test(`[${k}] WOW presentation displays exactly four concepts`, () => {
    const names = run(k).wowPresentation.concepts.map((c) => c.conceptName);
    assert.equal(names.length, 4);
    assert.deepEqual([...names].sort(), [...CONCEPTS].sort());
  });
  test(`[${k}] every concept clears the 90 gate`, () => {
    for (const c of run(k).wowPresentation.concepts) {
      assert.ok(c.wowScore >= 90, `${c.conceptName} scored ${c.wowScore}`);
      assert.equal(c.masterpiecePassed, true);
    }
  });
  test(`[${k}] a render plan exists for the recommended concept and is accepted`, () => {
    const r = run(k);
    assert.equal(r.renderPlan.conceptName, r.wowPresentation.recommendedConcept);
    assert.equal(r.renderPlan.accepted, true);
    assert.equal(r.renderPlan.qualityChecks.passed, true);
    assert.equal(r.renderPlan.exportTargets.length, 4);
  });
  test(`[${k}] a render plan exists for EACH of the four concepts, all passing`, () => {
    const r = run(k);
    for (const name of CONCEPTS) {
      const plan = renderPlanForConcept(r, name);
      assert.equal(plan.conceptName, name);
      assert.equal(plan.accepted, true);
      assert.equal(plan.qualityChecks.passed, true);
      assert.deepEqual(plan.qualityChecks.reasons, []);
    }
  });
  test(`[${k}] pipeline is deterministic`, () => {
    assert.deepEqual(run(k), run(k));
  });
  test(`[${k}] no pixels leak through the pipeline output`, () => {
    const s = JSON.stringify(run(k)).toLowerCase();
    for (const bad of ['data:image', 'base64', '<canvas', '<svg']) assert.ok(!s.includes(bad), `found ${bad}`);
  });
}

// ── demo builds (the bundle exists and contains the composed engines) ─
test('the demo bundle is built and contains the composed pipeline', () => {
  const bundle = join(componentsDir, 'demo', 'premium-reveal-demo.js');
  assert.ok(existsSync(bundle), 'premium-reveal-demo.js must exist');
  const src = readFileSync(bundle, 'utf8');
  for (const marker of ['runPipeline', 'generateCreativeBrief', 'generateWOWPresentation', 'generateRenderPlan', 'mountPremiumReveal']) {
    assert.ok(src.includes(marker), `bundle should include ${marker}`);
  }
});
test('the demo html wires the fixture selector and every stage panel', () => {
  const html = readFileSync(join(componentsDir, 'demo', 'premium-reveal-demo.html'), 'utf8');
  for (const id of ['fixture', 'reveal', 'plan-details', 'stage-mp', 'stage-cb', 'stage-wp', 'stage-plan']) {
    assert.ok(html.includes(`id="${id}"`), `html should contain #${id}`);
  }
  for (const opt of ['graduation', 'championship', 'family', 'wedding', 'memorial']) {
    assert.ok(html.includes(`value="${opt}"`), `selector should offer ${opt}`);
  }
});

// ── no production files changed ──────────────────────────────────────
// The demo must not MODIFY the existing shared engines or the reusable components.
// Adding a brand-new additive shared module (e.g. image-intelligence) is allowed, so we
// name the existing engines explicitly rather than guarding all of shared/.
// (index.html is intentionally + additively modified by the Sprint 9 WOW integration
//  and is bounded by its own guard in wowBridge.test.ts, so it is excluded here.)
const EXISTING_ENGINES = [
  'shared/render-engine', 'shared/render-orchestrator', 'shared/render-adapter',
  'shared/wow-engine', 'shared/creative-brief', 'shared/memory-profile',
  'shared/refinement-engine', 'components/src',
].join(' ');
test('the demo did not change the existing shared engines or reusable components', () => {
  const root = execSync('git rev-parse --show-toplevel', { cwd: componentsDir }).toString().trim();
  const status = execSync(`git status --porcelain -- ${EXISTING_ENGINES}`, { cwd: root }).toString().trim();
  assert.equal(status, '', `existing engines and components/src must be untouched, but git reports:\n${status}`);
});
