import { toPoisoningFreeArray, MapSymbol, SortSymbol } from './PoisoningFreeArray.js';
import { HasSymbol, SetSymbol, toPoisoningFreeMap } from './PoisoningFreeMap.js';
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

function captureOneRecursively(knownGlobals: AllGlobals, instance: unknown, name: string, topLevel: boolean): void {
  if (typeof instance !== 'function' && typeof instance !== 'object') {
    return;
  }
  if (instance === null || instance === undefined || knownGlobals[HasSymbol](instance)) {
    return;
  }
  const allDescriptorsDetails = extractAllDescriptorsDetails(instance);
  const localGlobal: GlobalDetails = {
    name,
    properties: toPoisoningFreeMap(new Map<string | symbol, PropertyDescriptor>()),
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
    if (topLevel && descriptorName[0] === '_') {
      // Do not scan what's sounds like private properties dropped on globalThis
      // For instance: do not track the content of globalThis.__coverage__
      continue;
    }
    const subGlobalName = topLevel ? name + '.' + String(descriptorName) : String(descriptorName);
    captureOneRecursively(knownGlobals, descriptor.value, subGlobalName, false);
  }
}

/** Capture all globals accessible from globalThis */
export function captureAllGlobals(): AllGlobals {
  const knownGlobals = toPoisoningFreeMap(new Map<unknown, GlobalDetails>());
  captureOneRecursively(knownGlobals, globalThis, 'globalThis', true);
  return knownGlobals;
}
