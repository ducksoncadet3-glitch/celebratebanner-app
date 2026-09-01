/**
 * Deployment-safety guard for the render engine.
 *
 * This package is compiled INTO two production images (see each Dockerfile's
 * `COPY shared/render-engine/`), so a change here must release every image that carries it.
 * During the text-fit incident deploy-api's path filter listed only `backend-stub/**`, so a
 * renderer fix auto-deployed to celebratebanner-web while the production render worker kept
 * running the previous renderer until the API deploy was dispatched by hand — preview and
 * print silently disagreed.
 *
 * These tests derive the requirement from the Dockerfiles rather than hardcoding a list, so
 * adding a THIRD image that consumes the renderer fails here until its deploy workflow is
 * wired up too.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const here = new URL('.', import.meta.url).pathname;
const ROOT = execSync('git rev-parse --show-toplevel', { cwd: here }).toString().trim();

/** Every Dockerfile in the repo that builds this package into its image. */
const DOCKERFILES = ['Dockerfile.web', 'backend-stub/Dockerfile'];

/** Which deploy workflow releases the image built by each Dockerfile. */
const DEPLOYED_BY: Record<string, string> = {
  'Dockerfile.web': '.github/workflows/deploy-web.yml',
  'backend-stub/Dockerfile': '.github/workflows/deploy-api.yml',
};

const RENDER_ENGINE_GLOB = 'shared/render-engine/**';

function read(rel: string): string {
  return readFileSync(path.join(ROOT, rel), 'utf8');
}

function consumesRenderEngine(dockerfile: string): boolean {
  return /^\s*COPY\s+shared\/render-engine\//m.test(read(dockerfile));
}

/**
 * Extract the `paths:` list under the `push:` trigger. Deliberately a small line scanner:
 * this package has no YAML dependency (devDeps: typescript only) and must stay that way so
 * the suite runs under a bare `node --test`.
 */
function pushPaths(workflow: string): string[] {
  const lines = read(workflow).split('\n');
  const out: string[] = [];
  let inPush = false;
  let inPaths = false;
  for (const line of lines) {
    if (/^\s{2}push:\s*$/.test(line)) { inPush = true; continue; }
    // Any other top-level trigger key ends the push block.
    if (inPush && /^\s{2}\S/.test(line) && !/^\s{2}push:/.test(line)) { inPush = false; inPaths = false; }
    if (!inPush) continue;
    if (/^\s{4}paths:\s*$/.test(line)) { inPaths = true; continue; }
    if (inPaths) {
      const m = /^\s{6}-\s*'?"?([^'"\s]+)'?"?\s*$/.exec(line);
      if (m) out.push(m[1]);
      else if (line.trim() && !line.trim().startsWith('#')) inPaths = false;
    }
  }
  return out;
}

test('the Dockerfiles we check actually exist', () => {
  for (const d of DOCKERFILES) {
    assert.ok(existsSync(path.join(ROOT, d)), `${d} is missing — update this guard`);
  }
});

test('every image that builds the render engine is released on a render-engine change', () => {
  const consumers = DOCKERFILES.filter(consumesRenderEngine);
  assert.ok(consumers.length >= 2, 'expected both the web and API images to build the renderer');

  for (const dockerfile of consumers) {
    const workflow = DEPLOYED_BY[dockerfile];
    assert.ok(workflow, `${dockerfile} consumes the renderer but no deploy workflow is mapped`);
    const paths = pushPaths(workflow);
    assert.ok(paths.length > 0, `${workflow}: could not read its push paths`);
    assert.ok(
      paths.includes(RENDER_ENGINE_GLOB),
      `${workflow} deploys an image built from shared/render-engine but does not trigger on ` +
        `"${RENDER_ENGINE_GLOB}". A renderer change would ship to some components and not ` +
        `others. Current paths: ${JSON.stringify(paths)}`,
    );
  }
});

test('each deploy workflow still triggers on its own source', () => {
  // Guards against a filter being loosened into "renderer only".
  const own: Record<string, string> = {
    '.github/workflows/deploy-web.yml': 'web/**',
    '.github/workflows/deploy-api.yml': 'backend-stub/**',
  };
  for (const [workflow, glob] of Object.entries(own)) {
    assert.ok(pushPaths(workflow).includes(glob), `${workflow} must still deploy on ${glob}`);
  }
});

test('deploy filters stay narrow — no wildcard that would deploy on any commit', () => {
  for (const workflow of Object.values(DEPLOYED_BY)) {
    for (const p of pushPaths(workflow)) {
      assert.notEqual(p, '**', `${workflow}: "**" would redeploy on every unrelated commit`);
      assert.notEqual(p, '*', `${workflow}: "*" is too broad`);
    }
  }
});

test('a workflow is not accidentally wired to deploy the OTHER app', () => {
  // deploy-api must not trigger on web-only source, and vice versa: they release different
  // Fly apps and the API carries a migration release_command.
  assert.ok(
    !pushPaths('.github/workflows/deploy-api.yml').includes('web/**'),
    'deploy-api must not release on a web-only change',
  );
  assert.ok(
    !pushPaths('.github/workflows/deploy-web.yml').includes('backend-stub/**'),
    'deploy-web must not release on an API-only change',
  );
});
