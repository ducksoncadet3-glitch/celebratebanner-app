import { h } from '../dom.ts';

/**
 * DirectorChoice — the small ribbon marking the AI Creative Director's
 * recommended concept.
 */
export function createDirectorChoice(): HTMLElement {
  return h(
    'span',
    { class: 'pr-choice', role: 'img', 'aria-label': "Director's Choice — the AI's recommended concept" },
    h('span', { 'aria-hidden': 'true' }, '★'),
    'Director’s Choice',
  );
}
