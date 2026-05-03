import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { safeJoin, safePop, safePush, safeSubstring, Error } from '../../../utils/globals.js';

/** @internal - tab is supposed to be composed of valid entries extracted from the source arbitraries */
export function partsToJoinedStringMapper(tab: string[]): string {
  return safeJoin(tab, '');
}

/** @internal */
type StackItem = {
  endIndexChunks: number;
  nextEndIndex: number;
  arbIndex: number;
  chunks: string[];
};

/** @internal */
function tryUnmapJoinedString(value: string, arbitraries: Arbitrary<string>[]): string[] | undefined {
  if (arbitraries.length === 0) {
    return value.length === 0 ? [] : undefined;
  }
  const stack: StackItem[] = [{ endIndexChunks: 0, nextEndIndex: 0, arbIndex: 0, chunks: [] }];
  while (stack.length > 0) {
    // oxlint-disable-next-line typescript/no-non-null-assertion
    const last = safePop(stack)!;
    for (let endIndex = last.nextEndIndex; endIndex <= value.length; ++endIndex) {
      const chunk = safeSubstring(value, last.endIndexChunks, endIndex);
      if (arbitraries[last.arbIndex].canShrinkWithoutContext(chunk)) {
        const newChunks = [...last.chunks, chunk];
        const nextArbIndex = last.arbIndex + 1;
        if (nextArbIndex === arbitraries.length) {
          if (endIndex === value.length) {
            return newChunks;
          }
          continue;
        }
        safePush(stack, { endIndexChunks: last.endIndexChunks, nextEndIndex: endIndex + 1, arbIndex: last.arbIndex, chunks: last.chunks });
        safePush(stack, { endIndexChunks: endIndex, nextEndIndex: endIndex, arbIndex: nextArbIndex, chunks: newChunks });
        break;
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
    const result = tryUnmapJoinedString(value, arbitraries);
    if (result === undefined) {
      throw new Error('Unable to unmap the received string');
    }
    return result;
  };
}
