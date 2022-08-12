import { toPoisoningFreeArray, SortSymbol } from './PoisoningFreeArray.js';
import { HasSymbol, SetSymbol, toPoisoningFreeMap } from './PoisoningFreeMap.js';
import { AllGlobals, GlobalDetails } from './types/AllGlobals.js';

const safeObjectGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
const safeObjectEntries = Object.entries;

function extractAllDescriptorsDetails(instance: unknown): [string, PropertyDescriptor][] {
  const descriptors: Record<string, PropertyDescriptor> = safeObjectGetOwnPropertyDescriptors(instance);
  const allDescriptorsDetails = toPoisoningFreeArray(safeObjectEntries(descriptors));
  return allDescriptorsDetails[SortSymbol]();
}

function captureOneRecursively(knownGlobals: AllGlobals, instance: unknown, name: string): void {
  if (typeof instance !== 'function' && typeof instance !== 'object') {
    return;
  }
  if (instance === null || instance === undefined || knownGlobals[HasSymbol](instance)) {
    return;
  }
  const allDescriptorsDetails = extractAllDescriptorsDetails(instance);
  const localGlobal: GlobalDetails = {
    name,
    properties: toPoisoningFreeMap(new Map<string, PropertyDescriptor>()),
  };
  knownGlobals[SetSymbol](instance, localGlobal);
  for (let index = 0; index !== allDescriptorsDetails.length; ++index) {
    const descriptorName = allDescriptorsDetails[index][0];
    const descriptor = allDescriptorsDetails[index][1];
    localGlobal.properties[SetSymbol](descriptorName, descriptor);
    captureOneRecursively(knownGlobals, descriptor.value, name + '.' + descriptorName);
  }
}

/** Capture all globals accessible from globalThis */
export function captureAllGlobals(): AllGlobals {
  const knownGlobals = toPoisoningFreeMap(new Map<unknown, GlobalDetails>());
  captureOneRecursively(knownGlobals, globalThis, 'globalThis');
  return knownGlobals;
}
