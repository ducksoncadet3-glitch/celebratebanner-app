/**
 * Frame registry. Importing this file populates the registry with all 20
 * built-in frames. Consumers can also call `registerFrame(...)` to add their
 * own without forking the engine.
 */
import './rounded.js';
import './shapes.js';
import './cards.js';
import './borders.js';
import './effects.js';

export { frameIds, getFrame, listFrames, registerFrame } from './registry.js';
export type { FrameRenderer } from '../types.js';
