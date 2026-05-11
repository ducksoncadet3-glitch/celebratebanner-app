/**
 * @celebratebanner/render-engine
 *
 * Deterministic, environment-agnostic banner rendering engine.
 *
 * Public API surface — most consumers only need:
 *   • renderPreview(target, input)   — browser-friendly fast preview
 *   • renderHD(target, input)        — server-side print-quality export
 *   • getMockup('retractable-stand').render(target, banner)
 *
 * Lower-level access for advanced consumers:
 *   • registerFrame / registerArrangement / registerMockup  — extend
 *   • listFrames / listArrangements / listMockups           — introspect
 *   • renderBanner(ctx, input)                              — direct draw
 */

export * from './types.js';

// Side-effect imports populate the registries.
import './frames/index.js';
import './arrangements/index.js';
import './mockups/index.js';

// Public exports
export { renderBanner, renderPreview, renderHD } from './pipeline/index.js';
export type { PreviewOptions, ExportOptions } from './pipeline/index.js';

export { frameIds, getFrame, listFrames, registerFrame } from './frames/index.js';
export { getArrangement, listArrangements, registerArrangement } from './arrangements/index.js';
export { getMockup, listMockups, registerMockup } from './mockups/index.js';

// Lower-level utilities — useful for custom themes or arrangements.
export { drawCover, roundRect, lightenHex, hexToRgba, tileToCount } from './canvas/helpers.js';
export { hexPath, diamondPath, scallopPath, heartPath, starPath } from './canvas/paths.js';
export { mulberry32, photoRot } from './canvas/rng.js';
export { drawBannerBackground } from './theme/background.js';
export { renderBannerText } from './theme/text.js';
export { drawHero3D, drawPhoto3D, drawPhotoFramed } from './frames/dispatch.js';
export { RENDER_INPUT_VERSION, type RenderInputVersion } from './schema/version.js';
