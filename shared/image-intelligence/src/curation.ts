/**
 * Supporting-photo curation — a gallery, not a camera roll.
 *
 * Near-identical uploads (burst shots, duplicates) make the supporting grid look raw
 * and repetitive. We drop near-duplicates by perceptual-hash distance, keeping the
 * first (highest-ranked) of each cluster. Photos without a hash are never dropped —
 * we refuse to discard a memory we cannot prove is a duplicate.
 */
import type { Curatable, CurationOptions, CurationResult } from './types.ts';

/** Hamming distance at/under which two aHash values are near-identical. */
export const DEFAULT_MAX_DISTANCE = 8;

const BITS: Record<string, number> = { 0: 0, 1: 1, 2: 1, 3: 2, 4: 1, 5: 2, 6: 2, 7: 3, 8: 1, 9: 2, a: 2, b: 3, c: 2, d: 3, e: 3, f: 4 };

/** Bit distance between two equal-length hex hashes. Unusable input → Infinity. */
export function hammingDistance(a: string | null | undefined, b: string | null | undefined): number {
  if (typeof a !== 'string' || typeof b !== 'string') return Infinity;
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y || x.length !== y.length) return Infinity;
  let d = 0;
  for (let i = 0; i < x.length; i++) {
    const nx = parseInt(x[i], 16);
    const ny = parseInt(y[i], 16);
    if (Number.isNaN(nx) || Number.isNaN(ny)) return Infinity;
    d += BITS[(nx ^ ny).toString(16)] ?? 0;
  }
  return d;
}

export function isNearDuplicate(a: string | null | undefined, b: string | null | undefined, maxDistance = DEFAULT_MAX_DISTANCE): boolean {
  return hammingDistance(a, b) <= maxDistance;
}

/**
 * Never let de-duplication starve the story. A customer who uploads six near-identical
 * burst shots must still get a poster with supporting memories, so curation restores
 * photos (best-ranked first) until at least this many survive.
 */
export const DEFAULT_MIN_KEEP = 4;

/**
 * Keep the first of every near-identical cluster. Order is preserved, so upstream
 * ranking (best photo first) survives curation. Curation never drops below `minKeep`
 * and never drops a photo whose hash is unknown.
 */
export function curatePhotos<T extends Curatable>(items: T[], options: CurationOptions = {}): CurationResult<T> {
  const maxDistance = options.maxDistance ?? DEFAULT_MAX_DISTANCE;
  const minKeep = options.minKeep ?? DEFAULT_MIN_KEEP;
  const list = (Array.isArray(items) ? items : []).filter(Boolean);

  const kept: T[] = [];
  const droppedItems: { item: T; duplicateOf: string; distance: number }[] = [];

  for (const item of list) {
    let duplicateOf: T | null = null;
    let distance = Infinity;
    for (const k of kept) {
      const d = hammingDistance(item.perceptualHash, k.perceptualHash);
      if (d <= maxDistance && d < distance) { duplicateOf = k; distance = d; }
    }
    if (duplicateOf) droppedItems.push({ item, duplicateOf: duplicateOf.id, distance });
    else kept.push(item);
  }

  // Story guard: put back the best-ranked duplicates until minKeep survive.
  while (kept.length < Math.min(minKeep, list.length) && droppedItems.length) {
    const restored = droppedItems.shift()!;
    kept.push(restored.item);
  }
  // Preserve the caller's original ordering after any restoration.
  const order = new Map(list.map((it, i) => [it, i] as const));
  kept.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));

  const limited = typeof options.limit === 'number' && options.limit >= 0 ? kept.slice(0, options.limit) : kept;
  return { kept: limited, dropped: droppedItems.map((d) => ({ id: d.item.id, duplicateOf: d.duplicateOf, distance: d.distance })) };
}
