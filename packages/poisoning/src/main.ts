import { captureAllGlobals } from './internals/CaptureAllGlobals';
import { diffGlobals } from './internals/DiffGlobals';

const initialGlobals = captureAllGlobals();

export function restoreGlobals(): void {
  const currentGlobals = captureAllGlobals();
  const diffs = diffGlobals(initialGlobals, currentGlobals);
  for (let index = 0; index !== diffs.length; ++index) {
    diffs[index].patch();
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
