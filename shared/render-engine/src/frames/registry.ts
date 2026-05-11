import type { FrameId, FrameRenderer } from '../types.js';

const REGISTRY = new Map<FrameId, FrameRenderer>();

export function registerFrame(renderer: FrameRenderer): void {
  REGISTRY.set(renderer.id, renderer);
}

export function getFrame(id: FrameId | undefined): FrameRenderer {
  const r = REGISTRY.get((id ?? 'rounded') as FrameId);
  return r ?? REGISTRY.get('rounded')!;
}

export function listFrames(): FrameRenderer[] {
  return [...REGISTRY.values()];
}

export function frameIds(): FrameId[] {
  return [...REGISTRY.keys()];
}
