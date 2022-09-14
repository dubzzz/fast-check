import { PoisoningFreeArray, MapSymbol, SortSymbol, ShiftSymbol, PushSymbol } from './PoisoningFreeArray.js';
import { HasSymbol, SetSymbol, PoisoningFreeMap } from './PoisoningFreeMap.js';
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

type NextCapture = {
  instance: unknown;
  name: string;
  currentDepth: number;
};

/** Capture all globals accessible from globalThis */
export function captureAllGlobals(): AllGlobals {
  const knownGlobals = PoisoningFreeMap.from<unknown, GlobalDetails>();
  const nextCaptures = PoisoningFreeArray.from<NextCapture>([
    { instance: globalThis, name: 'globalThis', currentDepth: 0 },
  ]);
  while (nextCaptures.length !== 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { instance, name, currentDepth } = nextCaptures[ShiftSymbol]()!;

    if (typeof instance !== 'function' && typeof instance !== 'object') {
      continue;
    }
    if (instance === null || instance === undefined || knownGlobals[HasSymbol](instance)) {
      continue;
    }

    const allDescriptorsDetails = extractAllDescriptorsDetails(instance);
    const localGlobal: GlobalDetails = {
      name,
      depth: currentDepth,
      properties: PoisoningFreeMap.from<string | symbol, PropertyDescriptor>(),
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
      const subGlobalName = currentDepth !== 0 ? name + '.' + SString(descriptorName) : SString(descriptorName);
      nextCaptures[PushSymbol]({ instance: descriptor.value, name: subGlobalName, currentDepth: currentDepth + 1 });
    }
  }
  return knownGlobals;
}
