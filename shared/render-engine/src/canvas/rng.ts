/**
 * Deterministic PRNG for jitter / rotations. Same seed → same output, which
 * means the same RenderInput produces the same banner on browser AND server.
 * Lifted directly from index.html so behavior is identical.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tiny seeded ±maxDeg rotation in radians. */
export function photoRot(rng: () => number, maxDeg: number): number {
  return (rng() * 2 - 1) * maxDeg * (Math.PI / 180);
}
