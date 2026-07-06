import { h } from '../dom.ts';

/**
 * WOWScore — the concept's 0–100 WOW Score as a compact badge.
 * Announced to screen readers as "WOW Score N out of 100".
 */
export function createWowScore(score: number, max = 100): HTMLElement {
  const n = Math.round(score);
  return h(
    'span',
    { class: 'pr-score', role: 'img', 'aria-label': `WOW Score ${n} out of ${max}` },
    h('span', { class: 'pr-score-num', 'aria-hidden': 'true' }, String(n)),
    h('span', { class: 'pr-score-max', 'aria-hidden': 'true' }, `/${max}`),
  );
}
