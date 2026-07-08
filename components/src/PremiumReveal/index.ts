import { h, clear } from '../dom.ts';
import { injectStyles } from '../styles.ts';
import { createRevealGallery } from '../RevealGallery/index.ts';
import { createLoadingSequence } from '../LoadingSequence/index.ts';
import { REVEAL_TITLE, REVEAL_SUBTITLE } from '../types.ts';
import type { PremiumRevealProps } from '../types.ts';

/**
 * PremiumReveal — the top-level experience: (optional six-stage loading) →
 * the reveal screen (title, subtitle, Director's Choice note, and the gallery
 * of four concept cards). Additive; no pricing, checkout, or renderer coupling.
 */
export function createPremiumReveal(props: PremiumRevealProps): HTMLElement {
  const { presentation, handlers, copyFor, skipLoading = false, loadingIntervalMs = 900, onRevealed } = props;
  injectStyles(document);

  const root = h('section', { class: 'pr-root', role: 'region', 'aria-label': 'Your masterpieces' });

  const renderReveal = (): void => {
    clear(root);
    root.appendChild(h('h1', { class: 'pr-title' }, REVEAL_TITLE));
    root.appendChild(h('p', { class: 'pr-subtitle' }, REVEAL_SUBTITLE));
    root.appendChild(
      h(
        'p',
        { class: 'pr-directors-note' },
        h('span', { 'aria-hidden': 'true' }, '★ '),
        `Director’s Choice: ${presentation.recommendedConcept}`,
      ),
    );
    root.appendChild(createRevealGallery({ presentation, copyFor, handlers }));
    onRevealed?.();
  };

  if (skipLoading) {
    renderReveal();
  } else {
    const loader = createLoadingSequence({ auto: true, intervalMs: loadingIntervalMs, onComplete: renderReveal });
    root.appendChild(loader.el);
  }

  return root;
}

/** Convenience: clear a container and mount the reveal into it. */
export function mountPremiumReveal(container: HTMLElement, props: PremiumRevealProps): HTMLElement {
  const root = createPremiumReveal(props);
  clear(container);
  container.appendChild(root);
  return root;
}
