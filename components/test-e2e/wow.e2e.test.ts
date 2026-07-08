/**
 * Sprint 12 — WOW end-to-end + mobile benchmark + accessibility smoke.
 *
 * Drives the REAL index.html in headless Chromium. Kept out of the unit-test glob
 * (test/*.test.ts) so `npm test` stays fast/deterministic; run explicitly with:
 *   node --test 'test-e2e/*.test.ts'
 *
 * Skips gracefully if the cached Chromium binary or playwright-core is unavailable.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { homedir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const CHROME = join(homedir(), '.cache/ms-playwright/chromium-1228/chrome-linux64/chrome');
const PW = join(repoRoot, 'components', 'node_modules', 'playwright-core');
const AVAILABLE = existsSync(CHROME) && existsSync(PW);

const MIME: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css' };

// ── static file server ───────────────────────────────────────────────
function startServer(): Promise<{ port: number; close: () => void }> {
  const server = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      const path = join(repoRoot, url === '/' ? 'index.html' : url.replace(/^\/+/, ''));
      if (!path.startsWith(repoRoot)) { res.writeHead(403); res.end(); return; }
      const body = await readFile(path);
      res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end('not found'); }
  });
  return new Promise((resolve) => server.listen(0, () => {
    const addr = server.address();
    resolve({ port: typeof addr === 'object' && addr ? addr.port : 0, close: () => server.close() });
  }));
}

// Inject six large high-contrast photos into builder state, go to preview, generate.
// NOTE: page.evaluate(string) evaluates an EXPRESSION, so every snippet is an IIFE.
const SETUP = `(async () => {
  if (typeof selectTheme === 'function') selectTheme('graduation');
  function mk(seed){ const c=document.createElement('canvas'); c.width=3000; c.height=4000; const x=c.getContext('2d');
    for(let i=0;i<c.width;i+=250){ x.fillStyle=(((i/250)+seed)%2)?'#161616':'#f0f0f0'; x.fillRect(i,0,250,c.height); }
    x.fillStyle='#b22234'; x.fillRect(500,1200,1300,1300); x.fillStyle='#0d2b45'; x.fillRect(1800,700,900,1900);
    return c.toDataURL('image/jpeg',0.92); }
  const load=(u)=>new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.src=u;});
  state.images=[]; for(let i=0;i<6;i++){ const u=mk(i*5); const im=await load(u);
    state.images.push({id:'p'+i,dataUrl:u,name:'photo'+i+'.jpg',imgEl:im,w:im.naturalWidth,h:im.naturalHeight,size:9000,type:'image/jpeg'}); }
  state.heroImage='p0';
})()`;
const GENERATE = `(() => { goto(3); generatePreview(true); })()`;

async function withBrowser(fn: (ctx: { chromium: unknown; base: string; close: () => void }) => Promise<void>): Promise<void> {
  const { chromium } = await import('playwright-core') as { chromium: { launch: (o: unknown) => Promise<unknown> } };
  const server = await startServer();
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--force-color-profile=srgb'] }) as { newPage: (o?: unknown) => Promise<unknown>; newContext: (o?: unknown) => Promise<unknown>; close: () => Promise<void> };
  try {
    await fn({ chromium: browser, base: `http://localhost:${server.port}`, close: () => {} });
  } finally {
    await browser.close();
    server.close();
  }
}

type Page = {
  goto: (u: string, o?: unknown) => Promise<unknown>;
  evaluate: (fn: string | ((a?: unknown) => unknown), arg?: unknown) => Promise<unknown>;
  waitForSelector: (s: string, o?: unknown) => Promise<unknown>;
  waitForTimeout: (ms: number) => Promise<void>;
  route: (p: string, h: (r: { abort: () => void }) => void) => Promise<void>;
  on: (e: string, h: (x: unknown) => void) => void;
  keyboard: { press: (k: string) => Promise<void> };
  close: () => Promise<void>;
  context: () => { newCDPSession: (p: Page) => Promise<{ send: (m: string, p?: unknown) => Promise<unknown> }> };
};

const skip = { skip: !AVAILABLE ? 'Chromium/playwright-core not available in this environment' : false };

// ── 1) Default mode (no ?wow=1) ──────────────────────────────────────
test('default mode: standard preview works, WOW never loads, checkout reachable', skip, async () => {
  await withBrowser(async ({ chromium, base }) => {
    const b = chromium as { newPage: (o?: unknown) => Promise<Page> };
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    const errors: string[] = [];
    p.on('pageerror', (e) => errors.push(String((e as Error).message)));
    await p.goto(`${base}/index.html`, { waitUntil: 'load' });
    await p.evaluate(SETUP);
    await p.evaluate(GENERATE);
    await p.waitForTimeout(900);
    const r = await p.evaluate(`(() => ({
      previewShown: getComputedStyle(document.getElementById('preview-canvas')).display === 'block' && state.previewGenerated === true,
      cbwow: typeof window.CBWOW,
      wowScripts: document.querySelectorAll('script[src*="wow-bridge"]').length,
      slotHidden: getComputedStyle(document.getElementById('wow-reveal-slot')).display === 'none',
      checkout: canEnter(4),
    }))()`) as Record<string, unknown>;
    assert.equal(r.previewShown, true);
    assert.equal(r.cbwow, 'undefined');
    assert.equal(r.wowScripts, 0);
    assert.equal(r.slotHidden, true);
    assert.equal(r.checkout, true, 'checkout/delivery must be reachable');
    assert.deepEqual(errors, []);
    await p.close();
  });
});

// ── 2) WOW mode (?wow=1) ─────────────────────────────────────────────
test('WOW mode: reveal mounts with four concepts, selection + checkout work', skip, async () => {
  await withBrowser(async ({ chromium, base }) => {
    const b = chromium as { newPage: (o?: unknown) => Promise<Page> };
    const p = await b.newPage({ viewport: { width: 1280, height: 1800 } });
    const errors: string[] = [];
    p.on('pageerror', (e) => errors.push(String((e as Error).message)));
    await p.goto(`${base}/index.html?wow=1`, { waitUntil: 'load' });
    await p.evaluate(SETUP);
    const before = await p.evaluate('state.wowSelectedConcept ?? null');
    await p.evaluate(GENERATE);
    await p.waitForSelector('#wow-reveal-slot .pr-card', { timeout: 12000 });
    await p.waitForTimeout(2500); // allow progressive render to finish
    const r = await p.evaluate(`(() => {
      const cards = [...document.querySelectorAll('#wow-reveal-slot .pr-card')];
      const choose = cards[1] && cards[1].querySelector('.pr-btn--choose'); if (choose) choose.click();
      return {
        cards: cards.length,
        badges: cards.map(c => c.dataset.renderStatus),
        rendered: document.querySelectorAll('#wow-reveal-slot .pr-card-preview-img').length,
        ctas: cards[0] ? [...cards[0].querySelectorAll('.pr-card-actions button')].map(b => b.textContent) : [],
        bullets: cards[0] ? cards[0].querySelectorAll('.pr-card-point').length : 0,
        ledes: cards[0] ? cards[0].querySelectorAll('.pr-card-lede').length : 0,
        internalWords: /FALLBACK|RENDERED|IN REVIEW/.test(document.querySelector('#wow-reveal-slot').innerText.toUpperCase()),
        selected: state.wowSelectedConcept,
        standardPreview: state.previewGenerated === true,
        checkout: canEnter(4),
        pkg: state.selectedPackage,
      };
    })()`) as Record<string, unknown>;
    assert.equal(r.cards, 4, 'four concept cards');
    assert.ok((r.badges as unknown[]).every((x) => x), 'every card carries an internal render status');
    assert.deepEqual(r.ctas, ['Choose This Design', 'More Details'], 'the two customer CTAs');
    assert.equal(r.bullets, 3, 'exactly three premium bullets');
    assert.equal(r.ledes, 1, 'exactly one emotional sentence');
    assert.equal(r.internalWords, false, 'no internal status words reach the customer');
    assert.ok((r.rendered as number) >= 1, 'at least one concept rendered real artwork');
    assert.equal(before, null);
    assert.ok(typeof r.selected === 'string' && (r.selected as string).length > 0, 'Love This updates state.wowSelectedConcept');
    assert.equal(r.standardPreview, true, 'standard preview still generated');
    assert.equal(r.checkout, true, 'checkout/delivery reachable in WOW mode');
    assert.deepEqual(errors, []);
    await p.close();
  });
});

// ── 3) Bundle load failure → graceful fallback ───────────────────────
test('bundle load failure: standard preview kept, no block, checkout reachable', skip, async () => {
  await withBrowser(async ({ chromium, base }) => {
    const b = chromium as { newPage: (o?: unknown) => Promise<Page> };
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    const errors: string[] = [];
    p.on('pageerror', (e) => errors.push(String((e as Error).message)));
    await p.route('**/wow/wow-bridge.js', (route) => route.abort());
    await p.goto(`${base}/index.html?wow=1`, { waitUntil: 'load' });
    await p.evaluate(SETUP);
    await p.evaluate(GENERATE);
    await p.waitForTimeout(2000);
    const r = await p.evaluate(`(() => ({
      previewUsable: state.previewGenerated === true && getComputedStyle(document.getElementById('preview-canvas')).display === 'block',
      slotHidden: getComputedStyle(document.getElementById('wow-reveal-slot')).display === 'none',
      cards: document.querySelectorAll('#wow-reveal-slot .pr-card').length,
      checkout: canEnter(4),
      interactive: typeof goto === 'function',
    }))()`) as Record<string, unknown>;
    assert.equal(r.previewUsable, true, 'standard preview remains usable');
    assert.equal(r.slotHidden, true);
    assert.equal(r.cards, 0);
    assert.equal(r.checkout, true, 'checkout reachable after bundle failure');
    assert.equal(r.interactive, true);
    assert.deepEqual(errors, [], 'no customer-blocking page error');
    await p.close();
  });
});

// ── 4) Accessibility smoke + keyboard navigation ─────────────────────
test('accessibility smoke: roles, labels, alt text, keyboard selection', skip, async () => {
  await withBrowser(async ({ chromium, base }) => {
    const b = chromium as { newPage: (o?: unknown) => Promise<Page> };
    const p = await b.newPage({ viewport: { width: 1280, height: 1800 } });
    await p.goto(`${base}/index.html?wow=1`, { waitUntil: 'load' });
    await p.evaluate(SETUP);
    await p.evaluate(GENERATE);
    await p.waitForSelector('#wow-reveal-slot .pr-card', { timeout: 12000 });
    await p.waitForTimeout(2500);
    const a11y = await p.evaluate(`(() => {
      const slot = document.getElementById('wow-reveal-slot');
      const region = slot.querySelector('[role="region"]');
      const cards = [...slot.querySelectorAll('.pr-card')];
      const buttons = [...slot.querySelectorAll('.pr-btn')];
      const imgs = [...slot.querySelectorAll('.pr-card-preview-img')];
      return {
        slotAriaLive: slot.getAttribute('aria-live'),
        hasRegion: !!region && !!region.getAttribute('aria-label'),
        cardsHaveRoleAndLabel: cards.length > 0 && cards.every(c => c.getAttribute('role') === 'group' && !!c.getAttribute('aria-label') && c.getAttribute('tabindex') === '0'),
        buttonsHaveLabels: buttons.length > 0 && buttons.every(btn => !!btn.getAttribute('aria-label')),
        imgsHaveAlt: imgs.every(i => !!i.getAttribute('alt')),
        firstCardConcept: cards[0] && cards[0].getAttribute('data-concept'),
      };
    })()`) as Record<string, unknown>;
    assert.equal(a11y.slotAriaLive, 'polite');
    assert.equal(a11y.hasRegion, true, 'reveal is a labeled region');
    assert.equal(a11y.cardsHaveRoleAndLabel, true, 'cards are focusable groups with labels');
    assert.equal(a11y.buttonsHaveLabels, true, 'action buttons have aria-labels');
    assert.equal(a11y.imgsHaveAlt, true, 'rendered previews have alt text');

    // Keyboard: focus the first "Love This" button and activate it with Enter.
    await p.evaluate(`(() => { const btn = document.querySelector('#wow-reveal-slot .pr-card .pr-btn--choose'); btn.focus(); })()`);
    const focused = await p.evaluate(`document.activeElement && document.activeElement.classList.contains('pr-btn--choose')`);
    assert.equal(focused, true, '"Choose This Design" is keyboard-focusable');
    await p.keyboard.press('Enter');
    const selected = await p.evaluate('state.wowSelectedConcept');
    assert.ok(typeof selected === 'string' && (selected as string).length > 0, 'Enter on a focused button selects the concept');
    await p.close();
  });
});

// ── 5) Mobile render benchmark (warn-only threshold) ─────────────────
const WARN_MS = 3000;
test('mobile benchmark: render time for four concepts (warn-only)', skip, async () => {
  await withBrowser(async ({ chromium, base }) => {
    const b = chromium as { newContext: (o?: unknown) => Promise<{ newPage: () => Promise<Page> }> };
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' });
    const p = await ctx.newPage();
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); // simulate a mid-tier phone
    await p.goto(`${base}/index.html?wow=1`, { waitUntil: 'load' });
    await p.evaluate(SETUP);
    const ms = await p.evaluate(`(async () => {
      const t0 = performance.now();
      goto(3); generatePreview(true);
      const deadline = t0 + 20000;
      while (performance.now() < deadline) {
        const done = document.querySelectorAll('#wow-reveal-slot .pr-card[data-render-status]').length;
        if (done >= 4) break;
        await new Promise(r => requestAnimationFrame(r));
      }
      return Math.round(performance.now() - t0);
    })()`) as number;
    console.log(`\n    [mobile benchmark] 4-concept render (4x CPU throttle, 390px): ${ms} ms  (warn threshold ${WARN_MS} ms)`);
    if (ms > WARN_MS) console.warn(`    ⚠ WARNING: mobile render ${ms}ms exceeds the ${WARN_MS}ms soft threshold (not failing yet).`);
    assert.ok(ms > 0 && ms < 20000, 'benchmark completed within the hard ceiling');
    await p.close();
  });
});
