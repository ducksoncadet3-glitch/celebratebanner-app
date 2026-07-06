import { h } from '../dom.ts';
import { LOADING_STAGES } from '../types.ts';
import type { LoadingSequenceProps } from '../types.ts';

export interface LoadingController {
  el: HTMLElement;
  stages: readonly string[];
  readonly index: number;
  goTo(i: number): void;
  next(): void;
  complete(): void;
  isComplete(): boolean;
  destroy(): void;
}

/**
 * LoadingSequence — the six-stage cinematic loading experience. Sequential,
 * accessible (aria-live announcements, aria-current on the active step).
 *
 * Drive it manually (goTo/next — used by tests) or set `auto: true` to advance
 * with timers. Elegant, restrained motion (see styles + prefers-reduced-motion).
 */
export function createLoadingSequence(props: LoadingSequenceProps = {}): LoadingController {
  const stages = LOADING_STAGES;
  const list = h('ol', { class: 'pr-stages' });
  const live = h('div', { class: 'pr-visually-hidden', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const el = h(
    'section',
    { class: 'pr-loading', 'aria-label': 'Creating your masterpieces' },
    h('h2', { class: 'pr-loading-title' }, 'Creating your masterpieces…'),
    list,
    live,
  );
  const rows: HTMLElement[] = stages.map((label, i) =>
    h(
      'li',
      { class: 'pr-stage pr-stage--pending', dataset: { index: String(i) } },
      h('span', { class: 'pr-stage-dot', 'aria-hidden': 'true' }),
      h('span', { class: 'pr-stage-label' }, label),
    ),
  );
  for (const r of rows) list.appendChild(r);

  let index = -1;
  let done = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function render(): void {
    rows.forEach((row, i) => {
      const state = done || i < index ? 'done' : i === index ? 'active' : 'pending';
      row.className = `pr-stage pr-stage--${state}`;
      if (state === 'active') row.setAttribute('aria-current', 'step');
      else row.removeAttribute('aria-current');
    });
  }

  function goTo(i: number): void {
    index = Math.max(0, Math.min(stages.length - 1, i));
    done = false;
    render();
    const label = stages[index]!;
    live.textContent = label;
    props.onStageChange?.(index, label);
  }

  function complete(): void {
    if (done) return;
    done = true;
    render();
    live.textContent = 'Your masterpieces are ready.';
    if (timer) { clearTimeout(timer); timer = null; }
    props.onComplete?.();
  }

  function next(): void {
    if (done) return;
    if (index < stages.length - 1) goTo(index + 1);
    else complete();
  }

  goTo(0);
  if (props.auto) {
    const ms = props.intervalMs ?? 900;
    const tick = (): void => {
      if (done) return;
      if (index < stages.length - 1) { goTo(index + 1); timer = setTimeout(tick, ms); }
      else complete();
    };
    timer = setTimeout(tick, ms);
  }

  return {
    el,
    stages,
    get index() { return index; },
    goTo,
    next,
    complete,
    isComplete: () => done,
    destroy() { if (timer) { clearTimeout(timer); timer = null; } },
  };
}
