import { PoisoningFreeArray, PushSymbol } from './PoisoningFreeArray';
import { EntriesSymbol, PoisoningFreeMap } from './PoisoningFreeMap';
import { AllGlobals, GlobalDetails } from './types/AllGlobals';

export type SubDiffOnGlobal = {
  keyName: string;
  globalDetails: Pick<GlobalDetails, 'depth' | 'name' | 'rootAncestors'>;
};

function shouldIgnoreGlobal(
  globalDetails: Pick<GlobalDetails, 'depth' | 'name' | 'rootAncestors'>,
  ignoredRootRegex: RegExp
): boolean {
  switch (globalDetails.depth) {
    case 0:
      return false; // need to check the name of the property
    case 1:
      return ignoredRootRegex.test(globalDetails.name);
    default: {
      let allRootsIgnored = true;
      const allRoots = [...globalDetails.rootAncestors];
      for (let rootIndex = 0; rootIndex !== allRoots.length; ++rootIndex) {
        allRootsIgnored = allRootsIgnored && ignoredRootRegex.test(allRoots[rootIndex]);
      }
      return allRootsIgnored;
    }
  }
}

/** Create a new arrays of diffs containing only eligible ones */
export function filterNonEligibleDiffs<TDiff extends SubDiffOnGlobal>(
  diffs: TDiff[],
  ignoredRootRegex: RegExp
): TDiff[] {
  const keptDiffs = PoisoningFreeArray.from<TDiff>([]);
  for (let index = 0; index !== diffs.length; ++index) {
    const diff = diffs[index];
    if (!shouldIgnoreGlobal(diff.globalDetails, ignoredRootRegex)) {
      keptDiffs[PushSymbol](diff);
    } else if (diff.globalDetails.depth === 0 && !ignoredRootRegex.test(diff.keyName)) {
      keptDiffs[PushSymbol](diff);
    }
  }
  return keptDiffs;
}

/** Pre-filter all globals to only kept eligible ones, not to scan too many of them */
export function filterGlobals(initialGlobals: AllGlobals, ignoredRootRegex: RegExp): AllGlobals {
  const newGlobalsArray = PoisoningFreeArray.from<[unknown, GlobalDetails]>([]);
  for (const entry of initialGlobals[EntriesSymbol]()) {
    if (!shouldIgnoreGlobal(entry[1], ignoredRootRegex)) {
      newGlobalsArray[PushSymbol](entry);
    }
  }
  return PoisoningFreeMap.from(newGlobalsArray);
}
