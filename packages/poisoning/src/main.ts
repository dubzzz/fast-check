import { captureAllGlobals } from './internals/CaptureAllGlobals.js';
import { filterGlobals, filterNonEligibleDiffs } from './internals/FilterNonEligibleDiffs.js';
import { trackDiffsOnGlobals } from './internals/TrackDiffsOnGlobal.js';

const initialGlobals = captureAllGlobals();

/**
 * Some extra options for {@link restoreGlobals} and {@link assertNoPoisoning}
 */
export type ExtraOptions = {
  /**
   * Discard any changes occuring on any root matching the regex or any of its children.
   * Elements being child of several roots must have all their roots ignored not be tracked.
   *
   * eg.: If pattern is /^_/ then any change of globalThis._ignored or children of it will be omitted.
   * Except changes on prop if globalThis._ignored.prop === globalThis.nonIgnored.prop as prop is part of a tracked root too.
   *
   * Remark: a root is a property directly accessible from globalThis
   */
  ignoredRootRegex?: RegExp;
};

/** Internal helper to share the extraction logic */
function trackDiffsOnGlobalsBasedOnOptions(options: ExtraOptions | undefined) {
  const ignoredRootRegex =
    options !== undefined && options.ignoredRootRegex !== undefined ? options.ignoredRootRegex : undefined;
  const allDiffs = trackDiffsOnGlobals(
    ignoredRootRegex !== undefined ? filterGlobals(initialGlobals, ignoredRootRegex) : initialGlobals
  );
  return ignoredRootRegex !== undefined ? filterNonEligibleDiffs(allDiffs, ignoredRootRegex) : allDiffs;
}

/**
 * Restore all globals as they were when first importing this package.
 *
 * Remark: At least, it attempts to do so
 */
export function restoreGlobals(options?: ExtraOptions): void {
  const diffs = trackDiffsOnGlobalsBasedOnOptions(options);
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
export function assertNoPoisoning(options?: ExtraOptions): void {
  const diffs = trackDiffsOnGlobalsBasedOnOptions(options);
  if (diffs.length !== 0) {
    let impactedElements = diffs[0].fullyQualifiedKeyName;
    for (let index = 1; index !== diffs.length; ++index) {
      impactedElements += ', ' + diffs[index].fullyQualifiedKeyName;
    }
    throw new Error('Poisoning detected on ' + impactedElements);
  }
}
