/**
 * Minimal vanilla-DOM helpers. No framework, no build step — just the DOM API.
 * Components are plain functions that return HTMLElements, usable from the existing
 * vanilla builder or any host. `document` is the ambient global (real browser, or
 * jsdom in tests).
 */

export type Child = Node | string | number | null | undefined | Child[];

export interface Attrs {
  class?: string;
  html?: string;
  dataset?: Record<string, string>;
  [key: string]: unknown;
}

/** Hyperscript: h('div', { class: 'x', onClick: fn }, child, child). */
export function h(tag: string, attrs?: Attrs | null, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k === 'html') el.innerHTML = String(v);
      else if (k === 'dataset') Object.assign(el.dataset, v as Record<string, string>);
      else if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      } else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  appendChildren(el, children);
  return el;
}

function appendChildren(el: HTMLElement, children: Child[]): void {
  for (const c of children) {
    if (c == null) continue;
    if (Array.isArray(c)) appendChildren(el, c);
    else if (typeof c === 'object' && 'nodeType' in c) el.appendChild(c);
    else el.appendChild(document.createTextNode(String(c)));
  }
}

/** Clear a node's children. */
export function clear(el: Node): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}
