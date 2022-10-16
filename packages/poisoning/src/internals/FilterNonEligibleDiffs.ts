import { GlobalDetails } from './types/AllGlobals';

/** Check whether or not a global has to be ignored for diff tracking */
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

/** Check whether or not a property from a global has to be ignored for diff tracking */
export function shouldIgnoreProperty(
  globalDetails: Pick<GlobalDetails, 'depth' | 'name' | 'rootAncestors'>,
  propertyName: string,
  ignoredRootRegex: RegExp
): boolean {
  return (
    shouldIgnoreGlobal(globalDetails, ignoredRootRegex) ||
    (globalDetails.depth === 0 && ignoredRootRegex.test(propertyName))
  );
}
