import { PoisoningFreeArray, PushSymbol } from './PoisoningFreeArray';
import { GlobalDetails } from './types/AllGlobals';

export type SubDiffOnGlobal = {
  keyName: string;
  globalDetails: Pick<GlobalDetails, 'depth' | 'name' | 'rootAncestors'>;
};

/** Create a new arrays of diffs containing only eligible ones */
export function filterNonEligibleDiffs<TDiff extends SubDiffOnGlobal>(
  diffs: TDiff[],
  ignoredRootRegex: RegExp
): TDiff[] {
  const keptDiffs = PoisoningFreeArray.from<TDiff>([]);
  for (let index = 0; index !== diffs.length; ++index) {
    const diff = diffs[index];
    switch (diff.globalDetails.depth) {
      case 0: {
        if (!ignoredRootRegex.test(diff.keyName)) {
          keptDiffs[PushSymbol](diff);
        }
        break;
      }
      case 1: {
        if (!ignoredRootRegex.test(diff.globalDetails.name)) {
          keptDiffs[PushSymbol](diff);
        }
        break;
      }
      default: {
        let allRootsIgnored = true;
        const allRoots = [...diff.globalDetails.rootAncestors];
        for (let rootIndex = 0; rootIndex !== allRoots.length; ++rootIndex) {
          allRootsIgnored = allRootsIgnored && ignoredRootRegex.test(allRoots[rootIndex]);
        }
        if (!allRootsIgnored) {
          keptDiffs[PushSymbol](diff);
        }
        break;
      }
    }
  }
  return keptDiffs;
}
