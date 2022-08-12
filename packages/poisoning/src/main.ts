import { captureAllGlobals } from './internals/CaptureAllGlobals.js';
import { trackDiffsOnGlobals } from './internals/TrackDiffsOnGlobal.js';

const initialGlobals = captureAllGlobals();

/**
 * Restore all globals as they were when first importing this package.
 *
 * Remark: At least, it attempts to do so
 */
export function restoreGlobals(): void {
  const diffs = trackDiffsOnGlobals(initialGlobals);
  for (let index = 0; index !== diffs.length; ++index) {
    diffs[index].patch();
  }
}

/**
 * Check whether or not some globlas have been poisoned by some code.
 *
 * Poisoned being one of the following changes:
 * - a new entity is accessible directly or indirectly from `globalThis`
 * - an entity referenced directly or indirectly on `globalThis` has been altered
 * - an entity referenced directly or indirectly on `globalThis` has been dropped
 *
 * Here are some examples of such changes:
 * - someone added a new global on `window` (browser case) or `global` (node case) or modern `globalThis` (everywhere)
 * - someone changed `Array.prototype.map` into another function
 */
export function assertNoPoisoning(): void {
  const diffs = trackDiffsOnGlobals(initialGlobals);
  if (diffs.length !== 0) {
    let impactedElements = diffs[0].keyName;
    for (let index = 1; index !== diffs.length; ++index) {
      impactedElements += ', ' + diffs[index].keyName;
    }
    throw new Error('Poisoning detected on ' + impactedElements);
  }
}
