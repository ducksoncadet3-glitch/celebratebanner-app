import { h } from '../dom.ts';

/**
 * MasterpieceBadge — a quiet mark of distinction, shown ONLY when a concept cleared
 * the WOW gate. A concept that did not clear it simply says nothing: "In review" is
 * internal language and never reaches the customer.
 */
export function createMasterpieceBadge(passed: boolean): HTMLElement {
  if (!passed) return h('span', { class: 'pr-badge-none', 'aria-hidden': 'true' });
  return h(
    'span',
    { class: 'pr-badge', role: 'img', 'aria-label': 'Masterpiece — passed the WOW quality gate' },
    h('span', { 'aria-hidden': 'true' }, '\u2728'),
    'Masterpiece',
  );
}
