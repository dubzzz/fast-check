import { captureAllGlobals } from './internals/CaptureAllGlobals';
import { diffGlobals } from './internals/DiffGlobals';
import { EntriesSymbol, HasSymbol } from './internals/PoisoningFreeMap';

const initialGlobals = captureAllGlobals();
const safeObjectDefineProperty = Object.defineProperty;
const safeObjectGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
const safeObjectEntries = Object.entries;

export function restoreGlobals(): void {
  const allInitialEntries = [...initialGlobals[EntriesSymbol]()];
  for (let index = 0; index !== allInitialEntries.length; ++index) {
    const entry = allInitialEntries[index][0];
    const entryProperties = allInitialEntries[index][1].properties;
    const allEntryProperties = [...entryProperties[EntriesSymbol]()];

    // Re-add dropped properties and fix altered ones
    for (let propertyIndex = 0; propertyIndex !== allEntryProperties.length; ++propertyIndex) {
      const propertyName = allEntryProperties[propertyIndex][0];
      const originalPropertyDescriptor = allEntryProperties[propertyIndex][1];
      const originalValue = originalPropertyDescriptor.value;
      if (!(propertyName in (entry as any)) || (entry as any)[propertyName] !== originalValue) {
        safeObjectDefineProperty(entry, propertyName, originalPropertyDescriptor);
      }
    }

    // Drop new and unwanted properties
    const newEntryProperties = safeObjectEntries(safeObjectGetOwnPropertyDescriptors(entry));
    const allNewEntryProperties = [...newEntryProperties];
    for (let propertyIndex = 0; propertyIndex !== allNewEntryProperties.length; ++propertyIndex) {
      const propertyName = allNewEntryProperties[propertyIndex][0];
      if (!entryProperties[HasSymbol](propertyName)) {
        delete (entry as any)[propertyName];
      }
    }
  }
}

export function assertNoPoisoning(): void {
  const currentGlobals = captureAllGlobals();
  const diffs = diffGlobals(initialGlobals, currentGlobals);
  if (diffs.length !== 0) {
    let impactedElements = '';
    for (let index = 0; index !== diffs.length; ++index) {
      const elementName =
        diffs[index].subKeyName !== undefined
          ? diffs[index].keyName + '[' + diffs[index].subKeyName + ']'
          : diffs[index].keyName;

      if (impactedElements.length === 0) {
        impactedElements = elementName;
      } else {
        impactedElements += ', ' + elementName;
      }
    }
    throw new Error('Poisoning detected on ' + impactedElements);
  }
}
