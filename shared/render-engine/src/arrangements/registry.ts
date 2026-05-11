import type { ArrangementId, ArrangementRenderer } from '../types.js';

const REGISTRY = new Map<ArrangementId, ArrangementRenderer>();

export function registerArrangement(r: ArrangementRenderer): void {
  REGISTRY.set(r.id, r);
}

export function getArrangement(id: ArrangementId | undefined): ArrangementRenderer {
  const r = REGISTRY.get((id ?? 'classic') as ArrangementId);
  return r ?? REGISTRY.get('classic')!;
}

export function listArrangements(): ArrangementRenderer[] {
  return [...REGISTRY.values()];
}
