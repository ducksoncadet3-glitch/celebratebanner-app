import type { MockupId, MockupRenderer } from '../types.js';

const REGISTRY = new Map<MockupId, MockupRenderer<unknown>>();

export function registerMockup<T>(r: MockupRenderer<T>): void {
  REGISTRY.set(r.id, r as MockupRenderer<unknown>);
}

export function getMockup<T = unknown>(id: MockupId): MockupRenderer<T> {
  const r = REGISTRY.get(id);
  if (!r) throw new Error(`Unknown mockup: ${id}`);
  return r as MockupRenderer<T>;
}

export function listMockups(): MockupRenderer<unknown>[] {
  return [...REGISTRY.values()];
}
