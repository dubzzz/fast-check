import { PoisoningFreeArray, MapSymbol, SortSymbol, ShiftSymbol, PushSymbol } from './PoisoningFreeArray.js';
import { GetSymbol, HasSymbol, SetSymbol, PoisoningFreeMap } from './PoisoningFreeMap.js';
import { AddSymbol, HasSymbol as SetHasSymbol, PoisoningFreeSet } from './PoisoningFreeSet.js';
import { AllGlobals, GlobalDetails } from './types/AllGlobals.js';

const SString = String;
const safeObjectGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
const safeObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
const safeObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;

function compareKeys(keyA: [string | symbol, PropertyDescriptor], keyB: [string | symbol, PropertyDescriptor]): number {
  const sA = SString(keyA[0]);
  const sB = SString(keyB[0]);
  return sA < sB ? -1 : sA > sB ? 1 : 0;
}

function extractAllDescriptorsDetails(instance: unknown): [string | symbol, PropertyDescriptor][] {
  const descriptors: Record<string | symbol, PropertyDescriptor> = safeObjectGetOwnPropertyDescriptors(instance);
  const allDescriptors = PoisoningFreeArray.from([
    ...safeObjectGetOwnPropertyNames(descriptors),
    ...safeObjectGetOwnPropertySymbols(descriptors),
  ]);
  const allDescriptorsDetails = PoisoningFreeArray.from(
    allDescriptors[MapSymbol]((name): [string | symbol, PropertyDescriptor] => [
      name,
      descriptors[name as keyof typeof descriptors],
    ])
  );
  return allDescriptorsDetails[SortSymbol](compareKeys);
}

/** Flag the roots on already existing globals */
function flagRootRecursively(knownGlobals: AllGlobals, instance: unknown, currentRoot: string): void {
  const storedGlobal = knownGlobals[GetSymbol](instance);
  if (storedGlobal === undefined) {
    // Unknown global, we can stop the recursion
    return;
  }
  if (storedGlobal.rootAncestors[SetHasSymbol](currentRoot)) {
    // Already flagged with this root, we can stop the recursion
    return;
  }
  // Add the new root to the existing list
  storedGlobal.rootAncestors[AddSymbol](currentRoot);
  // Stop if the currently scanned global is a root
  if (storedGlobal.depth <= 1) {
    return;
  }
  // Recurse into children of the current node
  for (const [, descriptor] of storedGlobal.properties) {
    flagRootRecursively(knownGlobals, descriptor.value, currentRoot);
  }
}

type NextCapture = {
  instance: unknown;
  name: string;
  currentDepth: number;
  lastRootInPath: string;
};

/** Capture all globals accessible from globalThis */
export function captureAllGlobals(): AllGlobals {
  const knownGlobals = PoisoningFreeMap.from<unknown, GlobalDetails>();
  const nextCaptures = PoisoningFreeArray.from<NextCapture>([
    { instance: globalThis, name: 'globalThis', currentDepth: 0, lastRootInPath: 'globalThis' },
  ]);
  while (nextCaptures.length !== 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { instance, name, currentDepth, lastRootInPath } = nextCaptures[ShiftSymbol]()!;

    if (typeof instance !== 'function' && typeof instance !== 'object') {
      continue;
    }
    if (instance === null || instance === undefined) {
      continue;
    }
    if (knownGlobals[HasSymbol](instance)) {
      flagRootRecursively(knownGlobals, instance, lastRootInPath);
      continue;
    }

    const allDescriptorsDetails = extractAllDescriptorsDetails(instance);
    const localGlobal: GlobalDetails = {
      name,
      depth: currentDepth,
      properties: PoisoningFreeMap.from<string | symbol, PropertyDescriptor>(),
      rootAncestors: PoisoningFreeSet.from([lastRootInPath]),
    };
    knownGlobals[SetSymbol](instance, localGlobal);
    for (let index = 0; index !== allDescriptorsDetails.length; ++index) {
      const descriptorName = allDescriptorsDetails[index][0];
      const descriptor = allDescriptorsDetails[index][1];
      localGlobal.properties[SetSymbol](descriptorName, descriptor);
      if (typeof descriptorName === 'symbol') {
        // Do not scan the internal data within keys attached symbol
        // For instance: do not monitor the content of globalThis.Symbol(JEST_STATE_SYMBOL)
        continue;
      }
      const subGlobalName = currentDepth !== 0 ? name + '.' + SString(descriptorName) : SString(descriptorName);
      const newLastRootInPath = currentDepth <= 1 ? name : lastRootInPath;
      nextCaptures[PushSymbol]({
        instance: descriptor.value,
        name: subGlobalName,
        currentDepth: currentDepth + 1,
        lastRootInPath: newLastRootInPath,
      });
    }
  }
  return knownGlobals;
}
