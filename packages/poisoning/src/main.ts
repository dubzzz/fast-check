import { captureAllGlobals } from './internals/CaptureAllGlobals';
import { trackDiffsOnGlobals } from './internals/TrackDiffsOnGlobal';

const initialGlobals = captureAllGlobals();

export function restoreGlobals(): void {
  const diffs = trackDiffsOnGlobals(initialGlobals);
  for (let index = 0; index !== diffs.length; ++index) {
    diffs[index].patch();
  }
}

export function assertNoPoisoning(): void {
  const diffs = trackDiffsOnGlobals(initialGlobals);
  if (diffs.length !== 0) {
    let impactedElements = diffs[0].keyName;
    for (let index = 1; index !== diffs.length; ++index) {
      impactedElements += ', ' + diffs[index].keyName;
    }
    throw new Error('Poisoning detected on ' + impactedElements);
  }
}
