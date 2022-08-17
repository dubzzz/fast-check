import { PoisoningFreeArray, toPoisoningFreeArray, PushSymbol } from './PoisoningFreeArray.js';
import { EntriesSymbol, HasSymbol } from './PoisoningFreeMap.js';
import { AllGlobals } from './types/AllGlobals.js';

const safeObjectGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
const safeObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
const safeObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;
const safeObjectIs = Object.is;
const safeObjectDefineProperty = Object.defineProperty;

type DiffOnGlobal = {
  keyName: string;
  type: 'added' | 'removed' | 'changed';
  patch: () => void;
};

/** Compute the diff between two versions of globals */
export function trackDiffsOnGlobals(initialGlobals: AllGlobals): DiffOnGlobal[] {
  const allInitialGlobals = [...initialGlobals[EntriesSymbol]()];
  const observedDiffs: PoisoningFreeArray<DiffOnGlobal> = toPoisoningFreeArray<DiffOnGlobal>([]);

  for (let index = 0; index !== allInitialGlobals.length; ++index) {
    const instance = allInitialGlobals[index][0];
    const name = allInitialGlobals[index][1].name;
    const currentDescriptors = safeObjectGetOwnPropertyDescriptors(instance);
    const initialProperties = allInitialGlobals[index][1].properties;
    const initialPropertiesList = [...initialProperties[EntriesSymbol]()];

    // Add back properties removed from the instance
    // OR Revert changes made to the properties already there initially
    for (let propertyIndex = 0; propertyIndex !== initialPropertiesList.length; ++propertyIndex) {
      const propertyName = initialPropertiesList[propertyIndex][0];
      const initialPropertyDescriptor = initialPropertiesList[propertyIndex][1];

      if (!(propertyName in (instance as any))) {
        observedDiffs[PushSymbol]({
          keyName: name + '.' + String(propertyName),
          type: 'removed',
          patch: () => {
            safeObjectDefineProperty(instance, propertyName, initialPropertyDescriptor);
          },
        });
      } else if (
        !safeObjectIs(initialPropertyDescriptor.value, (currentDescriptors as any)[propertyName].value) ||
        !safeObjectIs(initialPropertyDescriptor.get, (currentDescriptors as any)[propertyName].get) ||
        !safeObjectIs(initialPropertyDescriptor.set, (currentDescriptors as any)[propertyName].set)
      ) {
        observedDiffs[PushSymbol]({
          keyName: name + '.' + String(propertyName),
          type: 'changed',
          patch: () => {
            safeObjectDefineProperty(instance, propertyName, initialPropertyDescriptor);
          },
        });
      }
    }

    // Drop properties not part of the initial definition
    const currentDescriptorsList = [
      ...safeObjectGetOwnPropertyNames(instance),
      ...safeObjectGetOwnPropertySymbols(instance),
    ];
    for (let descriptorIndex = 0; descriptorIndex !== currentDescriptorsList.length; ++descriptorIndex) {
      const propertyName = currentDescriptorsList[descriptorIndex];
      if (!initialProperties[HasSymbol](propertyName)) {
        observedDiffs[PushSymbol]({
          keyName: name + '.' + String(propertyName),
          type: 'added',
          patch: () => {
            delete (instance as any)[propertyName];
          },
        });
      }
    }
  }

  return [...observedDiffs]; // remove extra stuff linked to PoisoningFreeArray
}
