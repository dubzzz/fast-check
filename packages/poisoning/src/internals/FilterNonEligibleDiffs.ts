import { PoisoningFreeArray, PushSymbol } from './PoisoningFreeArray';
import { GlobalDetails } from './types/AllGlobals';

export type SubDiffOnGlobal = {
  keyName: string;
  globalDetails: Pick<GlobalDetails, 'depth' | 'name' | 'rootAncestors'>;
};

export function shouldIgnoreGlobal(
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

export function shouldIgnoreProperty(
  globalDetails: Pick<GlobalDetails, 'depth' | 'name' | 'rootAncestors'>,
  propertyName: string,
  ignoredRootRegex: RegExp
): boolean {
  return (
    shouldIgnoreGlobal(globalDetails, ignoredRootRegex) ||
    (globalDetails.depth === 0 && !ignoredRootRegex.test(propertyName))
  );
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
