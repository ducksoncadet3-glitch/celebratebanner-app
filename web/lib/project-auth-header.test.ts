import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Launch guard: the browser must send the project access token as `Authorization: Bearer`.
 *
 * The API accepts either `Authorization: Bearer …` or `x-project-token`
 * (backend-stub/services/project-token.js → extractProjectToken), but the production CORS
 * allow-list is `Content-Type, Authorization, X-Internal-Secret`. A custom `x-project-token`
 * header therefore fails the browser preflight and the request never leaves the tab.
 *
 * The failure is silent (create-flow swallows autosave errors), so the customer would keep
 * designing while only their FIRST snapshot ever reached the server — and the paid HD render,
 * which reads the server-side render_input, would not match the proof they approved.
 *
 * Verified against production 2026-08-30: PATCH /api/projects/:id with Authorization: Bearer
 * returned 200 and advanced rev 1 → 2; a forged token returned 403.
 */
const API_TS = path.join(process.cwd(), 'lib/api.ts');
const source = readFileSync(API_TS, 'utf8');

/** Header names the browser may send cross-origin, per the production CORS allow-list. */
const CORS_ALLOWED = ['content-type', 'authorization', 'accept'];

describe('project token travels on a CORS-allowed header', () => {
  it('sends the token as Authorization: Bearer', () => {
    const bearer = source.match(/Authorization: `Bearer \$\{[^}]+\}`/g) ?? [];
    expect(bearer.length, 'both autosave and status must use Bearer').toBe(2);
  });

  it('never sets x-project-token as an actual request header', () => {
    // Comments may mention it; a real header assignment must not exist.
    const headerAssignments = source.match(/['"]x-project-token['"]\s*:/g) ?? [];
    expect(headerAssignments, 'x-project-token is blocked by the production CORS preflight')
      .toHaveLength(0);
  });

  it('every header the browser client sets is on the CORS allow-list', () => {
    // Collect header keys from object literals passed as `headers:` in the public client.
    const keys = new Set<string>();
    for (const m of source.matchAll(/headers:\s*[^\n]*?\{([^}]*)\}/g)) {
      for (const k of m[1].matchAll(/(?:^|[,{\s])['"]?([A-Za-z][A-Za-z0-9-]*)['"]?\s*:/g)) {
        keys.add(k[1].toLowerCase());
      }
    }
    // x-internal-secret is server-only (serverApi), never sent from a browser.
    const browserKeys = [...keys].filter((k) => k !== 'x-internal-secret');
    expect(browserKeys.length, 'expected to find header keys to check').toBeGreaterThan(0);
    for (const k of browserKeys) {
      expect(CORS_ALLOWED, `header "${k}" is not on the production CORS allow-list`).toContain(k);
    }
  });
});
