/**
 * Proof → Builder handoff (client side).
 *
 * The proof wizard and the /create builder keep separate state (the builder is a
 * localStorage-backed useReducer store; the wizard is local component state). To let a
 * customer flow from "request a proof" straight into "design it" without re-entering data,
 * the wizard stashes its answers in sessionStorage and the builder consumes them ONCE on
 * mount, applying only the fields the builder understands via its existing reducer actions.
 * Nothing here reaches into the store's internals.
 *
 * The pure mapping lives in ./mapping (no React) so it is unit-testable in isolation and
 * reusable from the server page. Those symbols are re-exported here for existing callers.
 */

import { useEffect, useRef, useState } from 'react';
import type { Dispatch } from 'react';
import type { ProjectAction } from '@/lib/project-store';
import { mapProofToBuilder } from './mapping';
import { productTitle } from './options';
import type { ProofFormData } from './types';

export { mapProofToBuilder, PROOF_PRODUCT_MAP } from './mapping';
export type { BuilderPrefill, ProductMapEntry, MapDeps } from './mapping';

/** sessionStorage (not local) so the handoff is scoped to this browsing session and
 * naturally cleared when the tab closes — it is one-shot, not durable state. */
const HANDOFF_KEY = 'cb_proof_handoff_v1';

/** Wizard side: stash answers for the builder to pick up on the next navigation. */
export function writeProofHandoff(data: ProofFormData): void {
  try {
    window.sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota — the builder simply starts blank, no crash */
  }
}

export function readProofHandoff(): ProofFormData | null {
  try {
    const raw = window.sessionStorage.getItem(HANDOFF_KEY);
    return raw ? (JSON.parse(raw) as ProofFormData) : null;
  } catch {
    return null;
  }
}

export function clearProofHandoff(): void {
  try {
    window.sessionStorage.removeItem(HANDOFF_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Builder side: consume any pending proof handoff exactly once on mount and apply the
 * compatible fields through the store's existing reducer actions. Runs AFTER the store's
 * own localStorage hydration (it is called after useProjectStore in CreateFlow), so proof
 * intent wins for theme/text while any restored photos are preserved. No handoff → no-op,
 * so users entering /create directly are completely unaffected.
 */
export function useProofHandoff(dispatch: Dispatch<ProjectAction>): { productLabel: string | null } {
  const applied = useRef(false);
  // The product the customer chose upstream, so the builder can SHOW what is being designed
  // instead of silently applying a theme. Null for direct /create visitors.
  const [productLabel, setProductLabel] = useState<string | null>(null);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;

    const data = readProofHandoff();
    if (!data) return;

    const prefill = mapProofToBuilder(data);
    if (prefill.themeId) {
      dispatch({ type: 'setTheme', themeId: prefill.themeId });
    }
    if (prefill.text) {
      for (const [key, value] of Object.entries(prefill.text)) {
        if (value) dispatch({ type: 'setText', key, value });
      }
    }
    // Starting composition for products that specify one. Dispatched through the store's
    // normal action, so the customer can change it immediately afterwards.
    if (prefill.arrangement) {
      dispatch({ type: 'setArrangement', arrangement: prefill.arrangement });
    }
    // Only claim an identity when the product actually mapped to a builder configuration.
    if (prefill.themeId && data.productId) {
      const title = productTitle(data.productId);
      if (title && title !== '—') setProductLabel(title);
    }
    clearProofHandoff();
  }, [dispatch]);

  return { productLabel };
}
