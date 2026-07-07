/**
 * A deterministic, pixel-free reference renderer used by the tests and the fixture
 * generator. It stands in for the production render engine: it consumes a translated
 * RenderRequest and returns a RenderedImage *handle* (a `uri` plus size/time metadata)
 * WITHOUT drawing real pixels. Given the same request it always returns the same
 * output, which is what makes the RenderedConcept fixtures snapshot-stable.
 *
 * A real binding wraps the render engine's renderPreview/renderHD instead (see README);
 * the adapter cannot tell the difference — both satisfy the `Renderer` port.
 */
import type { Renderer, RenderRequest, RenderedImage } from '../src/types.ts';

export interface StubRenderer extends Renderer {
  /** Every request the adapter handed to this renderer, in call order. */
  readonly calls: RenderRequest[];
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A recording stub renderer. Deterministic — no Date/random/I-O. */
export function createStubRenderer(): StubRenderer {
  const calls: RenderRequest[] = [];
  return {
    calls,
    render(request: RenderRequest): RenderedImage {
      calls.push(request);
      const area = request.widthPx * request.heightPx;
      const format = request.kind === 'export' ? (request.formats[0] ?? 'jpg') : 'png';
      const key = `${request.kind}:${request.targetId}:${request.seed}:${request.widthPx}x${request.heightPx}:${format}`;
      const h = hashString(key);
      return {
        targetId: request.targetId,
        kind: request.kind,
        format,
        widthPx: request.widthPx,
        heightPx: request.heightPx,
        colorMode: request.colorMode,
        uri: `cbr://${request.kind}/${request.targetId}/${h.toString(16)}`,
        // Synthetic-but-deterministic size/time derived from the canvas area.
        byteSize: 4096 + (area % 5_000_011),
        renderMs: 6 + (h % 40),
      };
    },
  };
}

/** A renderer that always fails — used to exercise the 'failed' path. */
export function createThrowingRenderer(): Renderer {
  return {
    render(): RenderedImage {
      throw new Error('stub renderer: forced failure');
    },
  };
}

/** A renderer that returns a zero-size (invalid) image — exercises validation. */
export function createEmptyImageRenderer(): Renderer {
  return {
    render(request: RenderRequest): RenderedImage {
      return {
        targetId: request.targetId, kind: request.kind, format: 'png',
        widthPx: 0, heightPx: 0, colorMode: request.colorMode,
        uri: '', byteSize: 0, renderMs: 0,
      };
    },
  };
}
