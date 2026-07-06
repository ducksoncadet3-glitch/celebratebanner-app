import { h } from '../dom.ts';
import { createConceptCard } from '../ConceptCard/index.ts';
import type { RevealGalleryProps } from '../types.ts';

/**
 * RevealGallery — the grid of four concept cards (the Director's Choice highlighted).
 * Cards are focusable; arrow keys (and Home/End) move focus between them.
 */
export function createRevealGallery(props: RevealGalleryProps): HTMLElement {
  const { presentation, handlers } = props;

  const cards = presentation.concepts.map((concept, i) =>
    createConceptCard({
      concept,
      index: i,
      isDirectorsChoice: concept.conceptName === presentation.recommendedConcept,
      handlers,
    }),
  );

  const gallery = h('div', { class: 'pr-gallery', role: 'group', 'aria-label': 'Four concept masterpieces' });
  for (const c of cards) gallery.appendChild(c);

  const NAV = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
  gallery.addEventListener('keydown', (ev) => {
    const e = ev as KeyboardEvent;
    if (!NAV.includes(e.key)) return;
    const active = document.activeElement as HTMLElement | null;
    let idx = cards.findIndex((c) => c === active);
    if (idx === -1) idx = 0;
    let nextIdx = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIdx = Math.min(cards.length - 1, idx + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIdx = Math.max(0, idx - 1);
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = cards.length - 1;
    if (nextIdx !== idx) { e.preventDefault(); cards[nextIdx]!.focus(); }
  });

  return gallery;
}
