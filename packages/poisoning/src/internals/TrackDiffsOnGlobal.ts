import { PoisoningFreeArray, PushSymbol } from './PoisoningFreeArray.js';
import { EntriesSymbol, HasSymbol } from './PoisoningFreeMap.js';
import { AllGlobals, GlobalDetails } from './types/AllGlobals.js';

const SString = String;
const safeObjectGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
const safeObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
const safeObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols;
const safeObjectIs = Object.is;
const safeObjectDefineProperty = Object.defineProperty;

type DiffOnGlobal = {
  keyName: string;
  fullyQualifiedKeyName: string;
  type: 'added' | 'removed' | 'changed';
  globalDetails: GlobalDetails;
  patch: () => void;
};

/** Compute the diff between two versions of globals */
export function trackDiffsOnGlobals(initialGlobals: AllGlobals): DiffOnGlobal[] {
  const allInitialGlobals = [...initialGlobals[EntriesSymbol]()];
  const observedDiffs = PoisoningFreeArray.from<DiffOnGlobal>([]);

  for (let index = 0; index !== allInitialGlobals.length; ++index) {
    const instance = allInitialGlobals[index][0];
    const globalDetails = allInitialGlobals[index][1];
    const name = globalDetails.name;
    const currentDescriptors = safeObjectGetOwnPropertyDescriptors(instance);
    const initialProperties = globalDetails.properties;
    const initialPropertiesList = [...initialProperties[EntriesSymbol]()];

    // Add back properties removed from the instance
    // OR Revert changes made to the properties already there initially
    for (let propertyIndex = 0; propertyIndex !== initialPropertiesList.length; ++propertyIndex) {
      const propertyName = initialPropertiesList[propertyIndex][0];
      const initialPropertyDescriptor = initialPropertiesList[propertyIndex][1];

      if (!(propertyName in (currentDescriptors as any))) {
        observedDiffs[PushSymbol]({
          keyName: SString(propertyName),
          fullyQualifiedKeyName: name + '.' + SString(propertyName),
          type: 'removed',
          patch: () => {
            safeObjectDefineProperty(instance, propertyName, initialPropertyDescriptor);
          },
          globalDetails,
        });
      } else if (
        !safeObjectIs(initialPropertyDescriptor.value, (currentDescriptors as any)[propertyName].value) ||
        !safeObjectIs(initialPropertyDescriptor.get, (currentDescriptors as any)[propertyName].get) ||
        !safeObjectIs(initialPropertyDescriptor.set, (currentDescriptors as any)[propertyName].set)
      ) {
        observedDiffs[PushSymbol]({
          keyName: SString(propertyName),
          fullyQualifiedKeyName: name + '.' + SString(propertyName),
          type: 'changed',
          patch: () => {
            safeObjectDefineProperty(instance, propertyName, initialPropertyDescriptor);
          },
          globalDetails,
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
          keyName: SString(propertyName),
          fullyQualifiedKeyName: name + '.' + SString(propertyName),
          type: 'added',
          patch: () => {
            delete (instance as any)[propertyName];
          },
          globalDetails,
        });
      }
    }
  }

  return [...observedDiffs]; // remove extra stuff linked to PoisoningFreeArray
}
