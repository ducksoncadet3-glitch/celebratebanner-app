/**
 * Premium Reveal UI tests. Node's built-in runner + jsdom (dev dependency):
 *   node --test 'test/*.test.ts'
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

// ── jsdom global environment (components use the ambient `document`) ──────────
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { pretendToBeVisual: true });
const g = globalThis as unknown as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
g.KeyboardEvent = dom.window.KeyboardEvent;
g.MouseEvent = dom.window.MouseEvent;
g.Node = dom.window.Node;
g.HTMLElement = dom.window.HTMLElement;

import {
  createPremiumReveal, mountPremiumReveal, createRevealGallery, createConceptCard,
  createDirectorChoice, createMasterpieceBadge, createWowScore, createLoadingSequence,
  injectStyles, STYLE_ELEMENT_ID, LOADING_STAGES, REVEAL_TITLE, REVEAL_SUBTITLE,
} from '../src/index.ts';
import type { WowPresentation, WowConcept } from '../src/index.ts';

const here = dirname(fileURLToPath(import.meta.url));
const PRES: WowPresentation = JSON.parse(
  readFileSync(join(here, '..', '..', 'shared', 'wow-engine', 'fixtures', 'graduation.json'), 'utf8'),
);
const concept0 = (): WowConcept => structuredClone(PRES.concepts[0]!);
const failingConcept = (): WowConcept => ({ ...concept0(), masterpiecePassed: false, wowScore: 84 });

const doc = dom.window.document;
const mount = (el: HTMLElement): HTMLElement => { doc.body.appendChild(el); return el; };
const cleanupBody = (): void => { doc.body.innerHTML = ''; };

// ── WOWScore ─────────────────────────────────────────────────────────
test('WOWScore renders the rounded number', () => {
  assert.equal(createWowScore(93.6).querySelector('.pr-score-num')!.textContent, '94');
});
test('WOWScore has an accessible "out of 100" label', () => {
  assert.equal(createWowScore(92).getAttribute('aria-label'), 'WOW Score 92 out of 100');
});
test('WOWScore supports a custom max', () => {
  assert.match(createWowScore(40, 50).getAttribute('aria-label')!, /out of 50/);
});

// ── MasterpieceBadge ─────────────────────────────────────────────────
test('MasterpieceBadge (passed) shows Masterpiece and is not pending', () => {
  const b = createMasterpieceBadge(true);
  assert.match(b.textContent!, /Masterpiece/);
  assert.ok(!b.className.includes('pr-badge--pending'));
  assert.match(b.getAttribute('aria-label')!, /passed/i);
});
test('MasterpieceBadge (not passed) is pending and says In review', () => {
  const b = createMasterpieceBadge(false);
  assert.ok(b.className.includes('pr-badge--pending'));
  assert.match(b.textContent!, /In review/);
});

// ── DirectorChoice ───────────────────────────────────────────────────
test("DirectorChoice renders the ribbon with an accessible label", () => {
  const d = createDirectorChoice();
  assert.match(d.textContent!, /Director/);
  assert.equal(d.getAttribute('role'), 'img');
  assert.match(d.getAttribute('aria-label')!, /Director's Choice/);
});

// ── ConceptCard ──────────────────────────────────────────────────────
function card(overrides: Partial<Parameters<typeof createConceptCard>[0]> = {}): HTMLElement {
  return createConceptCard({ concept: concept0(), index: 0, isDirectorsChoice: false, ...overrides });
}
test('ConceptCard shows the concept name', () => {
  assert.equal(card().querySelector('.pr-card-name')!.textContent, PRES.concepts[0]!.conceptName);
});
test('ConceptCard shows the creative explanation', () => {
  assert.equal(card().querySelector('.pr-card-explanation')!.textContent, PRES.concepts[0]!.creativeExplanation);
});
test('ConceptCard shows the recommended product', () => {
  assert.match(card().querySelector('.pr-card-product')!.textContent!, new RegExp(PRES.concepts[0]!.recommendedProduct));
});
test('ConceptCard shows the purchase psychology', () => {
  assert.equal(card().querySelector('.pr-card-psychology')!.textContent, PRES.concepts[0]!.purchasePsychology);
});
test('ConceptCard uses a preview placeholder (no image/canvas)', () => {
  const c = card();
  assert.ok(c.querySelector('.pr-card-preview'));
  assert.equal(c.querySelectorAll('img,canvas,svg').length, 0);
});
test('ConceptCard contains a WOW score and a masterpiece badge', () => {
  const c = card();
  assert.ok(c.querySelector('.pr-score'));
  assert.ok(c.querySelector('.pr-badge'));
});
test('ConceptCard has exactly the three action buttons with the right labels', () => {
  const btns = [...card().querySelectorAll('.pr-card-actions button')];
  assert.deepEqual(btns.map((b) => b.textContent), ['Love This', 'See Details', 'Try Another Direction']);
});
test('ConceptCard action buttons are type=button with concept-specific aria-labels', () => {
  for (const b of card().querySelectorAll('.pr-card-actions button')) {
    assert.equal(b.getAttribute('type'), 'button');
    assert.match(b.getAttribute('aria-label')!, new RegExp(PRES.concepts[0]!.conceptName));
  }
});
test('ConceptCard "Love This" fires onLove with the concept', () => {
  let got: WowConcept | null = null;
  const c = card({ handlers: { onLove: (x) => { got = x; } } });
  (c.querySelector('.pr-btn--love') as HTMLElement).click();
  assert.equal(got!.conceptName, PRES.concepts[0]!.conceptName);
});
test('ConceptCard "See Details" fires onDetails', () => {
  let n = 0;
  const c = card({ handlers: { onDetails: () => { n++; } } });
  (c.querySelector('.pr-btn--details') as HTMLElement).click();
  assert.equal(n, 1);
});
test('ConceptCard "Try Another Direction" fires onTryAnother', () => {
  let n = 0;
  const c = card({ handlers: { onTryAnother: () => { n++; } } });
  (c.querySelector('.pr-btn--another') as HTMLElement).click();
  assert.equal(n, 1);
});
test('ConceptCard is a focusable group with a descriptive aria-label', () => {
  const c = card();
  assert.equal(c.getAttribute('role'), 'group');
  assert.equal(c.getAttribute('tabindex'), '0');
  assert.match(c.getAttribute('aria-label')!, /concept, WOW score \d+ of 100/);
});
test("ConceptCard director's choice: highlighted, aria-current, has the ribbon", () => {
  const c = card({ isDirectorsChoice: true });
  assert.ok(c.className.includes('pr-card--directors'));
  assert.equal(c.getAttribute('aria-current'), 'true');
  assert.ok(c.querySelector('.pr-choice'));
});
test('ConceptCard non-choice: no highlight, no aria-current, no ribbon', () => {
  const c = card({ isDirectorsChoice: false });
  assert.ok(!c.className.includes('pr-card--directors'));
  assert.equal(c.getAttribute('aria-current'), null);
  assert.equal(c.querySelector('.pr-choice'), null);
});
test('ConceptCard for a sub-90 concept shows the In-review badge', () => {
  const c = createConceptCard({ concept: failingConcept(), index: 1, isDirectorsChoice: false });
  assert.ok(c.querySelector('.pr-badge--pending'));
});
test('ConceptCard carries its stagger index (style + data-index)', () => {
  const c = card({ index: 2 });
  assert.match(c.getAttribute('style')!, /--pr-index:2/);
  assert.equal(c.dataset.index, '2');
});

// ── RevealGallery ────────────────────────────────────────────────────
test('RevealGallery renders exactly four cards, in concept order', () => {
  const gal = createRevealGallery({ presentation: PRES });
  const cards = [...gal.querySelectorAll('.pr-card')];
  assert.equal(cards.length, 4);
  assert.deepEqual(cards.map((c) => (c as HTMLElement).dataset.concept), PRES.concepts.map((c) => c.conceptName));
});
test('RevealGallery marks exactly one Director\'s Choice, matching the presentation', () => {
  const gal = createRevealGallery({ presentation: PRES });
  const choice = [...gal.querySelectorAll('.pr-card--directors')];
  assert.equal(choice.length, 1);
  assert.equal((choice[0] as HTMLElement).dataset.concept, PRES.recommendedConcept);
});
test('RevealGallery is a labelled group', () => {
  const gal = createRevealGallery({ presentation: PRES });
  assert.equal(gal.getAttribute('role'), 'group');
  assert.match(gal.getAttribute('aria-label')!, /concept masterpieces/i);
});
test('RevealGallery: ArrowRight moves focus to the next card', () => {
  cleanupBody();
  const gal = mount(createRevealGallery({ presentation: PRES }));
  const cards = [...gal.querySelectorAll('.pr-card')] as HTMLElement[];
  cards[0]!.focus();
  gal.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(doc.activeElement, cards[1]);
});
test('RevealGallery: ArrowLeft moves focus to the previous card', () => {
  cleanupBody();
  const gal = mount(createRevealGallery({ presentation: PRES }));
  const cards = [...gal.querySelectorAll('.pr-card')] as HTMLElement[];
  cards[2]!.focus();
  gal.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  assert.equal(doc.activeElement, cards[1]);
});
test('RevealGallery: Home/End focus first/last card', () => {
  cleanupBody();
  const gal = mount(createRevealGallery({ presentation: PRES }));
  const cards = [...gal.querySelectorAll('.pr-card')] as HTMLElement[];
  cards[1]!.focus();
  gal.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(doc.activeElement, cards[3]);
  gal.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(doc.activeElement, cards[0]);
});
test('RevealGallery propagates handlers to its cards', () => {
  let loved = '';
  const gal = createRevealGallery({ presentation: PRES, handlers: { onLove: (c) => { loved = c.conceptName; } } });
  (gal.querySelector('.pr-btn--love') as HTMLElement).click();
  assert.equal(loved, PRES.concepts[0]!.conceptName);
});

// ── LoadingSequence ──────────────────────────────────────────────────
test('LoadingSequence renders all six stages with the exact copy', () => {
  const c = createLoadingSequence();
  const labels = [...c.el.querySelectorAll('.pr-stage-label')].map((l) => l.textContent);
  assert.deepEqual(labels, [...LOADING_STAGES]);
});
test('LoadingSequence starts on the first stage (active + aria-current)', () => {
  const c = createLoadingSequence();
  assert.equal(c.index, 0);
  const rows = [...c.el.querySelectorAll('.pr-stage')];
  assert.ok(rows[0]!.className.includes('pr-stage--active'));
  assert.equal(rows[0]!.getAttribute('aria-current'), 'step');
});
test('LoadingSequence next() advances and marks the previous stage done', () => {
  const c = createLoadingSequence();
  c.next();
  const rows = [...c.el.querySelectorAll('.pr-stage')];
  assert.equal(c.index, 1);
  assert.ok(rows[0]!.className.includes('pr-stage--done'));
  assert.ok(rows[1]!.className.includes('pr-stage--active'));
});
test('LoadingSequence goTo() sets done/active/pending correctly', () => {
  const c = createLoadingSequence();
  c.goTo(3);
  const rows = [...c.el.querySelectorAll('.pr-stage')];
  assert.ok(rows[2]!.className.includes('pr-stage--done'));
  assert.ok(rows[3]!.className.includes('pr-stage--active'));
  assert.ok(rows[4]!.className.includes('pr-stage--pending'));
});
test('LoadingSequence calls onStageChange with index + label', () => {
  const seen: Array<[number, string]> = [];
  const c = createLoadingSequence({ onStageChange: (i, l) => seen.push([i, l]) });
  c.next();
  assert.deepEqual(seen[0], [0, LOADING_STAGES[0]]);
  assert.deepEqual(seen[1], [1, LOADING_STAGES[1]]);
});
test('LoadingSequence complete() marks all done and calls onComplete', () => {
  let done = 0;
  const c = createLoadingSequence({ onComplete: () => { done++; } });
  c.complete();
  assert.ok([...c.el.querySelectorAll('.pr-stage')].every((r) => r.className.includes('pr-stage--done')));
  assert.equal(done, 1);
  assert.equal(c.isComplete(), true);
});
test('LoadingSequence next() past the last stage completes', () => {
  let done = 0;
  const c = createLoadingSequence({ onComplete: () => { done++; } });
  for (let i = 0; i < LOADING_STAGES.length + 2; i++) c.next();
  assert.equal(done, 1);
  assert.equal(c.isComplete(), true);
});
test('LoadingSequence exposes a polite aria-live status region', () => {
  const c = createLoadingSequence();
  const live = c.el.querySelector('[role="status"]');
  assert.ok(live);
  assert.equal(live!.getAttribute('aria-live'), 'polite');
});
test('LoadingSequence isComplete is false until completion', () => {
  const c = createLoadingSequence();
  assert.equal(c.isComplete(), false);
});

// ── PremiumReveal ────────────────────────────────────────────────────
test('PremiumReveal (skipLoading) renders title, subtitle, choice note, and 4 cards', () => {
  const root = createPremiumReveal({ presentation: PRES, skipLoading: true });
  assert.equal(root.querySelector('.pr-title')!.textContent, REVEAL_TITLE);
  assert.equal(root.querySelector('.pr-subtitle')!.textContent, REVEAL_SUBTITLE);
  assert.match(root.querySelector('.pr-directors-note')!.textContent!, new RegExp(PRES.recommendedConcept));
  assert.equal(root.querySelectorAll('.pr-card').length, 4);
});
test('PremiumReveal (default) shows the loading sequence first, not the title', () => {
  const root = createPremiumReveal({ presentation: PRES });
  assert.ok(root.querySelector('.pr-loading'));
  assert.equal(root.querySelector('.pr-title'), null);
});
test('PremiumReveal root is a labelled region', () => {
  const root = createPremiumReveal({ presentation: PRES, skipLoading: true });
  assert.equal(root.getAttribute('role'), 'region');
  assert.match(root.getAttribute('aria-label')!, /masterpieces/i);
});
test('PremiumReveal injects the stylesheet exactly once', () => {
  createPremiumReveal({ presentation: PRES, skipLoading: true });
  createPremiumReveal({ presentation: PRES, skipLoading: true });
  injectStyles(doc);
  assert.equal(doc.querySelectorAll(`#${STYLE_ELEMENT_ID}`).length, 1);
});
test('PremiumReveal auto-loading transitions to the reveal (title appears)', async () => {
  await new Promise<void>((resolve) => {
    const root = createPremiumReveal({ presentation: PRES, loadingIntervalMs: 1, onRevealed: () => resolve() });
    mount(root);
  });
  const roots = [...doc.querySelectorAll('.pr-root')];
  assert.ok(roots.some((r) => r.querySelector('.pr-title')));
});
test('mountPremiumReveal clears the container and mounts the root', () => {
  cleanupBody();
  const container = doc.createElement('div');
  const stale = doc.createElement('p');
  stale.className = 'stale-child';
  container.appendChild(stale);
  mount(container);
  mountPremiumReveal(container, { presentation: PRES, skipLoading: true });
  // the pre-existing child was cleared; the container now holds exactly the reveal root
  assert.equal(container.querySelector('.stale-child'), null);
  assert.equal(container.children.length, 1);
  assert.ok(container.firstElementChild!.classList.contains('pr-root'));
});

// ── No pixels / accessibility sweep ──────────────────────────────────
test('the whole reveal contains no images/canvas/svg/data-URIs', () => {
  const root = createPremiumReveal({ presentation: PRES, skipLoading: true });
  assert.equal(root.querySelectorAll('img,canvas,svg,picture,video').length, 0);
  assert.ok(!root.innerHTML.toLowerCase().includes('data:image'));
});
test('every action button has an aria-label and every card is focusable', () => {
  const root = createPremiumReveal({ presentation: PRES, skipLoading: true });
  for (const b of root.querySelectorAll('button')) assert.ok(b.getAttribute('aria-label'));
  for (const c of root.querySelectorAll('.pr-card')) assert.equal(c.getAttribute('tabindex'), '0');
});
