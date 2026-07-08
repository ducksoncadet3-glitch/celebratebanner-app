import { h } from '../dom.ts';
import type { Attrs } from '../dom.ts';
import { createWowScore } from '../WOWScore/index.ts';
import { createMasterpieceBadge } from '../MasterpieceBadge/index.ts';
import { createDirectorChoice } from '../DirectorChoice/index.ts';
import { CTA_PRIMARY, CTA_SECONDARY } from '../types.ts';
import type { ConceptCardProps, ConceptCopy, WowConcept } from '../types.ts';

/**
 * ConceptCard — one art-directed concept, presented like an agency board:
 *
 *   • large artwork preview        • Director's Choice badge (when applicable)
 *   • title                        • ONE emotional sentence
 *   • THREE premium bullets        • primary CTA + secondary CTA
 *
 * No long paragraphs, no pricing, no checkout. Internal words — FALLBACK, RENDERED,
 * IN REVIEW — never appear here; render status travels as a `data-render-status`
 * attribute for internal tooling only.
 */

/** House copy when the Art Director has not spoken (component stays usable standalone). */
function fallbackCopy(concept: WowConcept): ConceptCopy {
  return {
    title: concept.conceptName,
    emotionalSentence: concept.title || 'A moment worth keeping, composed with care.',
    bullets: [
      'Museum-grade composition',
      `Recommended as ${concept.recommendedProduct}`,
      'Printed at 300 DPI on archival stock',
    ],
  };
}

export function createConceptCard(props: ConceptCardProps): HTMLElement {
  const { concept, index, isDirectorsChoice, handlers = {} } = props;
  const copy = props.copy ?? fallbackCopy(concept);
  const bullets = copy.bullets.slice(0, 3);

  const labelBits = [`${copy.title} concept`, `WOW score ${Math.round(concept.wowScore)} of 100`];
  if (concept.masterpiecePassed) labelBits.push('masterpiece');
  if (isDirectorsChoice) labelBits.push("Director's Choice");

  // Large artwork preview. The renderer fills this; the mark is the resting state.
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

  const cta = (
    cls: string,
    text: string,
    ariaVerb: string,
    cb?: (c: WowConcept) => void,
  ): HTMLElement =>
    h(
      'button',
      { type: 'button', class: `pr-btn ${cls}`, 'aria-label': `${ariaVerb}: ${copy.title}`, onClick: () => cb?.(concept) },
      text,
    );

  const actions = h(
    'div',
    { class: 'pr-card-actions' },
    cta('pr-btn--choose', CTA_PRIMARY, 'Choose this design', handlers.onChoose),
    cta('pr-btn--details', CTA_SECONDARY, 'More details for', handlers.onDetails),
  );

  const points = h(
    'ul',
    { class: 'pr-card-points' },
    ...bullets.map((b) => h('li', { class: 'pr-card-point' }, b)),
  );

  const body = h(
    'div',
    { class: 'pr-card-body' },
    h('h3', { class: 'pr-card-name' }, copy.title),
    concept.masterpiecePassed ? createMasterpieceBadge(true) : null,
    h('p', { class: 'pr-card-lede' }, copy.emotionalSentence),
    points,
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
