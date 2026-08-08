import { describe, expect, it } from 'vitest';
import { newProjectId } from './utils';

describe('newProjectId', () => {
  it('keeps the proj_ prefix', () => {
    expect(newProjectId()).toMatch(/^proj_/);
  });

  it('has the expected shape and length (proj_ + 32 hex chars, url/path-safe)', () => {
    const id = newProjectId();
    // "proj_" (5) + 32 lowercase hex chars from a hyphen-stripped UUID.
    expect(id).toMatch(/^proj_[0-9a-f]{32}$/);
    expect(id).toHaveLength(37);
    // URL/path-safe: no characters that would need encoding.
    expect(encodeURIComponent(id)).toBe(id);
  });

  it('produces unique ids across many samples', () => {
    const n = 10_000;
    const ids = new Set<string>();
    for (let i = 0; i < n; i++) ids.add(newProjectId());
    expect(ids.size).toBe(n);
  });

  it('does not fall back to Math.random (uses the crypto CSPRNG)', () => {
    // Guard against a regression to the predictable Math.random generator.
    const original = Math.random;
    let called = false;
    Math.random = () => {
      called = true;
      return original();
    };
    try {
      const id = newProjectId();
      expect(id).toMatch(/^proj_[0-9a-f]{32}$/);
      expect(called).toBe(false);
    } finally {
      Math.random = original;
    }
  });
});
