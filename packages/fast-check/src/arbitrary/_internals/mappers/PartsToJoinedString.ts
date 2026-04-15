import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { safeJoin, safeSubstring, Error } from '../../../utils/globals.js';

/** @internal - tab is supposed to be composed of valid entries extracted from the source arbitraries */
export function partsToJoinedStringMapper(tab: string[]): string {
  return safeJoin(tab, '');
}

/** @internal */
function tryUnmapJoinedString(
  value: string,
  startIndex: number,
  arbitraries: Arbitrary<string>[],
  arbIndex: number,
): string[] | undefined {
  if (arbIndex === arbitraries.length) {
    return startIndex === value.length ? [] : undefined;
  }
  for (let endIndex = startIndex; endIndex <= value.length; ++endIndex) {
    const chunk = safeSubstring(value, startIndex, endIndex);
    if (arbitraries[arbIndex].canShrinkWithoutContext(chunk)) {
      const rest = tryUnmapJoinedString(value, endIndex, arbitraries, arbIndex + 1);
      if (rest !== undefined) {
        return [chunk, ...rest];
      }
    }
  }
  return undefined;
}

/** @internal */
export function partsToJoinedStringUnmapperFor(
  arbitraries: Arbitrary<string>[],
): (value: unknown) => string[] {
  return function partsToJoinedStringUnmapper(value: unknown): string[] {
    if (typeof value !== 'string') {
      throw new Error('Unsupported value');
    }
    const result = tryUnmapJoinedString(value, 0, arbitraries, 0);
    if (result === undefined) {
      throw new Error('Unable to unmap the received string');
    }
    return result;
  };
}
