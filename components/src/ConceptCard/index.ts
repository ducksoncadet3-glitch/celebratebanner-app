import { h } from '../dom.ts';
import type { Attrs } from '../dom.ts';
import { createWowScore } from '../WOWScore/index.ts';
import { createMasterpieceBadge } from '../MasterpieceBadge/index.ts';
import { createDirectorChoice } from '../DirectorChoice/index.ts';
import type { ConceptCardProps, WowConcept } from '../types.ts';

/**
 * ConceptCard — one premium concept: preview placeholder, name, WOW score,
 * masterpiece badge, creative explanation, recommended product, purchase
 * psychology, and the three actions (Love This · See Details · Try Another
 * Direction). No pricing, no checkout, no rendered pixels — a placeholder preview.
 */
export function createConceptCard(props: ConceptCardProps): HTMLElement {
  const { concept, index, isDirectorsChoice, handlers = {} } = props;

  const labelBits = [`${concept.conceptName} concept`, `WOW score ${Math.round(concept.wowScore)} of 100`];
  if (concept.masterpiecePassed) labelBits.push('masterpiece');
  if (isDirectorsChoice) labelBits.push("Director's Choice");

  // Preview placeholder (NO renderer integration yet).
  const preview = h(
    'div',
    { class: 'pr-card-preview', 'aria-hidden': 'true' },
    h('div', { class: 'pr-card-preview-mark' }, 'Preview'),
  );
  const topline = h(
    'div',
    { class: 'pr-card-topline' },
    isDirectorsChoice ? createDirectorChoice() : h('span'),
    createWowScore(concept.wowScore),
  );
  const previewWrap = h('div', { class: 'pr-card-media' }, preview, topline);

  const button = (
    cls: string,
    text: string,
    ariaVerb: string,
    cb?: (c: WowConcept) => void,
  ): HTMLElement =>
    h(
      'button',
      { type: 'button', class: `pr-btn ${cls}`, 'aria-label': `${ariaVerb}: ${concept.conceptName}`, onClick: () => cb?.(concept) },
      text,
    );

  const actions = h(
    'div',
    { class: 'pr-card-actions' },
    button('pr-btn--love', 'Love This', 'Love this concept', handlers.onLove),
    button('pr-btn--details', 'See Details', 'See details for', handlers.onDetails),
    button('pr-btn--another', 'Try Another Direction', 'Try another direction than', handlers.onTryAnother),
  );

  const body = h(
    'div',
    { class: 'pr-card-body' },
    h('h3', { class: 'pr-card-name' }, concept.conceptName),
    concept.title ? h('p', { class: 'pr-card-title' }, concept.title) : null,
    createMasterpieceBadge(concept.masterpiecePassed),
    h('p', { class: 'pr-card-explanation' }, concept.creativeExplanation),
    h('p', { class: 'pr-card-product' }, 'Recommended as ', h('b', {}, concept.recommendedProduct)),
    h('p', { class: 'pr-card-psychology' }, concept.purchasePsychology),
    actions,
  );

  const attrs: Attrs = {
    class: `pr-card${isDirectorsChoice ? ' pr-card--directors' : ''}`,
    role: 'group',
    tabindex: '0',
    dataset: { concept: concept.conceptName, index: String(index) },
    'aria-label': labelBits.join(', '),
    style: `--pr-index:${index}`,
  };
  if (isDirectorsChoice) attrs['aria-current'] = 'true';

  return h('article', attrs, previewWrap, body);
}
