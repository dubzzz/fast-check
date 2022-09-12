import { toPoisoningFreeArray, MapSymbol, SortSymbol } from './PoisoningFreeArray.js';
import { GetSymbol, HasSymbol, SetSymbol, toPoisoningFreeMap } from './PoisoningFreeMap.js';
import { AllGlobals, GlobalDetails } from './types/AllGlobals.js';

const safeObjectGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
const safeObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
const safeObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;

function compareKeys(keyA: [string | symbol, PropertyDescriptor], keyB: [string | symbol, PropertyDescriptor]): number {
  return String(keyA[0]).localeCompare(String(keyB[0]));
}

function extractAllDescriptorsDetails(instance: unknown): [string | symbol, PropertyDescriptor][] {
  const descriptors: Record<string | symbol, PropertyDescriptor> = safeObjectGetOwnPropertyDescriptors(instance);
  const allDescriptors = toPoisoningFreeArray([
    ...safeObjectGetOwnPropertyNames(descriptors),
    ...safeObjectGetOwnPropertySymbols(descriptors),
  ]);
  const allDescriptorsDetails = toPoisoningFreeArray(
    allDescriptors[MapSymbol]((name): [string | symbol, PropertyDescriptor] => [
      name,
      descriptors[name as keyof typeof descriptors],
    ])
  );
  return allDescriptorsDetails[SortSymbol](compareKeys);
}

function flagRootRecursively(knownGlobals: AllGlobals, instance: unknown, currentRoot: string): void {
  const storedGlobal = knownGlobals[GetSymbol](instance);
  if (storedGlobal === undefined) {
    // Unknown global, we can stop the recursion
    return;
  }
  if (storedGlobal.topLevelRoots[HasSymbol](currentRoot)) {
    // Already flagged with this root, we can stop the recursion
    return;
  }
  // Add the new root to the existing list
  storedGlobal.topLevelRoots[SetSymbol](currentRoot, true);
  // Recurse into children of the current node
  for (const [, descriptor] of storedGlobal.properties) {
    flagRootRecursively(knownGlobals, descriptor.value, currentRoot);
  }
}

function captureOneRecursively(
  knownGlobals: AllGlobals,
  instance: unknown,
  name: string,
  currentDepth: number,
  currentRoot: string
): void {
  if (typeof instance !== 'function' && typeof instance !== 'object') {
    return;
  }
  if (instance === null || instance === undefined) {
    return;
  }
  if (knownGlobals[HasSymbol](instance)) {
    flagRootRecursively(knownGlobals, instance, currentRoot);
    return;
  }
  const allDescriptorsDetails = extractAllDescriptorsDetails(instance);
  const localGlobal: GlobalDetails = {
    name,
    properties: toPoisoningFreeMap(new Map<string | symbol, PropertyDescriptor>()),
    depth: currentDepth,
    topLevelRoots: toPoisoningFreeMap(
      new Map<string, true>([
        ['globalThis', true],
        [currentRoot, true], // Potentially including itself
      ])
    ),
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
    if (currentDepth === 0 && descriptorName[0] === '_') {
      // Do not scan what's sounds like private properties dropped on globalThis
      // For instance: do not track the content of globalThis.__coverage__
      continue;
    }
    const subGlobalName = currentDepth !== 0 ? name + '.' + String(descriptorName) : String(descriptorName);
    captureOneRecursively(
      knownGlobals,
      descriptor.value,
      subGlobalName,
      currentDepth + 1,
      currentDepth !== 0 ? currentRoot : subGlobalName
    );
  }
}

/** Capture all globals accessible from globalThis */
export function captureAllGlobals(): AllGlobals {
  const knownGlobals = toPoisoningFreeMap(new Map<unknown, GlobalDetails>());
  captureOneRecursively(knownGlobals, globalThis, 'globalThis', 0, 'globalThis');
  return knownGlobals;
}
