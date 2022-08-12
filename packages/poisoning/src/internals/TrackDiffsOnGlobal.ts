import { PoisoningFreeArray, toPoisoningFreeArray, PushSymbol } from './PoisoningFreeArray.js';
import { EntriesSymbol, HasSymbol } from './PoisoningFreeMap.js';
import { AllGlobals } from './types/AllGlobals.js';

const safeObjectGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
const safeObjectEntries = Object.entries;
const safeObjectIs = Object.is;

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
    const initialProperties = allInitialGlobals[index][1].properties;
    const initialPropertiesList = [...initialProperties[EntriesSymbol]()];

    // Add back properties removed from the instance
    // OR Revert changes made to the properties already there initially
    for (let propertyIndex = 0; propertyIndex !== initialPropertiesList.length; ++propertyIndex) {
      const propertyName = initialPropertiesList[propertyIndex][0];
      const initialPropertyDescriptor = initialPropertiesList[propertyIndex][1];
      const initialPropertyValue = initialPropertyDescriptor.value;
      if (!(propertyName in (instance as any))) {
        observedDiffs[PushSymbol]({
          keyName: name + '.' + propertyName,
          type: 'removed',
          patch: () => {
            Object.defineProperty(instance, propertyName, initialPropertyDescriptor);
          },
        });
      } else if (!safeObjectIs(initialPropertyValue, (instance as any)[propertyName])) {
        observedDiffs[PushSymbol]({
          keyName: name + '.' + propertyName,
          type: 'changed',
          patch: () => {
            Object.defineProperty(instance, propertyName, initialPropertyDescriptor);
          },
        });
      }
    }

    // Drop properties not part of the initial definition
    const currentDescriptors = safeObjectGetOwnPropertyDescriptors(instance);
    const currentDescriptorsList = safeObjectEntries(currentDescriptors);
    for (let descriptorIndex = 0; descriptorIndex !== currentDescriptorsList.length; ++descriptorIndex) {
      const propertyName = currentDescriptorsList[descriptorIndex][0];
      if (!initialProperties[HasSymbol](propertyName)) {
        observedDiffs[PushSymbol]({
          keyName: name + '.' + propertyName,
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
