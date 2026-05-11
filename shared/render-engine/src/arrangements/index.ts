/**
 * Arrangement registry. Importing this file populates the registry with the
 * 5 built-in arrangements. Third parties can call registerArrangement(...) to
 * add their own without forking.
 */
import './classic.js';
import './magazine.js';
import './pyramid.js';
import './scattered.js';
import './mosaic.js';

export {
  getArrangement,
  listArrangements,
  registerArrangement,
} from './registry.js';
export type { ArrangementRenderer } from '../types.js';
