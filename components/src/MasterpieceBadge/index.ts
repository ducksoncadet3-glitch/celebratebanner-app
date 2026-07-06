import { h } from '../dom.ts';

/**
 * MasterpieceBadge — signals whether a concept cleared the WOW gate (≥90).
 * Screen-reader labelled; decorative sparkle is aria-hidden.
 */
export function createMasterpieceBadge(passed: boolean): HTMLElement {
  if (passed) {
    return h(
      'span',
      { class: 'pr-badge', role: 'img', 'aria-label': 'Masterpiece — passed the WOW quality gate' },
      h('span', { 'aria-hidden': 'true' }, '✨'),
      'Masterpiece',
    );
  }
  return h(
    'span',
    { class: 'pr-badge pr-badge--pending', role: 'img', 'aria-label': 'In review — not yet a masterpiece' },
    'In review',
  );
}
