import { PoisoningFreeArray, toPoisoningFreeArray, PushSymbol } from './PoisoningFreeArray';
import { EntriesSymbol, HasSymbol, GetSymbol } from './PoisoningFreeMap';
import { AllGlobals } from './types/AllGlobals';

const safeObjectIs = Object.is;

type DiffGlobals = {
  keyName: string;
  subKeyName: string;
  type: 'added' | 'removed' | 'changed';
  patch: () => void;
};

/** Compute the diff between two versions of globals */
export function diffGlobals(initialGlobals: AllGlobals, newGlobals: AllGlobals): DiffGlobals[] {
  const allInitialEntries = [...initialGlobals[EntriesSymbol]()];
  const observedDiffs: PoisoningFreeArray<DiffGlobals> = toPoisoningFreeArray<DiffGlobals>([]);

  // changed
  for (let index = 0; index !== allInitialEntries.length; ++index) {
    const entry = allInitialEntries[index][0];
    const entryName = allInitialEntries[index][1].name;
    const entryProperties = allInitialEntries[index][1].properties;
    const allEntryProperties = [...entryProperties[EntriesSymbol]()];
    if (!newGlobals[HasSymbol](entry)) {
      continue;
    }
    const newEntryMatch = newGlobals[GetSymbol](entry)!;
    const newEntryProperties = newEntryMatch.properties;
    const allNewEntryProperties = [...newEntryProperties[EntriesSymbol]()];

    // added
    for (let propertyIndex = 0; propertyIndex !== allNewEntryProperties.length; ++propertyIndex) {
      const propertyName = allNewEntryProperties[propertyIndex][0];
      if (!entryProperties[HasSymbol](propertyName)) {
        observedDiffs[PushSymbol]({
          keyName: entryName,
          subKeyName: propertyName,
          type: 'added',
          patch: () => {
            delete (entry as object)[propertyName];
          },
        });
      }
    }

    // removed
    for (let propertyIndex = 0; propertyIndex !== allEntryProperties.length; ++propertyIndex) {
      const propertyName = allEntryProperties[propertyIndex][0];
      const propertyDescriptor = allEntryProperties[propertyIndex][1];
      if (!newEntryProperties[HasSymbol](propertyName)) {
        observedDiffs[PushSymbol]({
          keyName: entryName,
          subKeyName: propertyName,
          type: 'removed',
          patch: () => {
            Object.defineProperty(entry, propertyName, propertyDescriptor);
          },
        });
      }
    }

    // changed
    for (let propertyIndex = 0; propertyIndex !== allEntryProperties.length; ++propertyIndex) {
      const propertyName = allEntryProperties[propertyIndex][0];
      const propertyDescriptor = allEntryProperties[propertyIndex][1];
      if (!newEntryProperties[HasSymbol](propertyName)) {
        continue;
      }
      const newEntryPropertyMatch = newEntryProperties[GetSymbol](propertyName)!;
      if (!safeObjectIs(propertyDescriptor.value, newEntryPropertyMatch.value)) {
        observedDiffs[PushSymbol]({
          keyName: entryName,
          subKeyName: propertyName,
          type: 'changed',
          patch: () => {
            Object.defineProperty(entry, propertyName, propertyDescriptor);
          },
        });
      }
    }
  }

  return [...observedDiffs]; // remove extra stuff linked to PoisoningFreeArray
}
