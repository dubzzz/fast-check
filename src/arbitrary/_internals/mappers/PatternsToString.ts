import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { maxLengthFromMinLength } from '../helpers/MaxLengthFromMinLength';
import { StringSharedConstraints } from '../../_shared/StringSharedConstraints';

/** @internal - tab is supposed to be composed of valid entries extracted from the source arbitrary */
export function patternsToStringMapper(tab: string[]): string {
  return tab.join('');
}

/** @internal */
export function patternsToStringUnmapperFor(
  patternsArb: Arbitrary<string>,
  constraints: StringSharedConstraints
): (value: unknown) => string[] {
  return function patternsToStringUnmapper(value: unknown): string[] {
    // First match wins! Possibly not the best match.
    // Empty strings are not considered as valid chunks.
    // Example:
    // >  Size limit (not known here) is [min: 0, max: 2], we want to revert "abc" and both ["a","b","c"] and ["ab", "c"] are possible.
    // >  Unmap to ["a", "b", "c"] while not in [min: 0, max: 2].

    if (typeof value !== 'string') {
      throw new Error('Unsupported value');
    }

    const minLength = constraints.minLength !== undefined ? constraints.minLength : 0;
    const maxLength = constraints.maxLength !== undefined ? constraints.maxLength : maxLengthFromMinLength(minLength);
    if (value.length === 0) {
      if (minLength > 0) {
        throw new Error('Unable to unmap received string');
      }
      return [];
    }

    // DFS analysis
    const stack: StackItem[] = [{ endIndexChunks: 0, nextStartIndex: 1, chunks: [] }];
    while (stack.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const last = stack.pop()!;

      // Going deeper in the tree
      for (let index = last.nextStartIndex; index <= value.length; ++index) {
        const chunk = value.substring(last.endIndexChunks, index);
        if (patternsArb.canShrinkWithoutContext(chunk)) {
          const newChunks = last.chunks.concat([chunk]);
          if (index === value.length) {
            if (newChunks.length < minLength || newChunks.length > maxLength) {
              break;
            }
            return newChunks; // we found a full match
          }
          // Pushed in case we need to try for next indices
          stack.push({ endIndexChunks: last.endIndexChunks, nextStartIndex: index + 1, chunks: last.chunks });
          // Pushed to go deeper in the tree
          stack.push({ endIndexChunks: index, nextStartIndex: index + 1, chunks: newChunks });
          break;
        }
      }
    }
    throw new Error('Unable to unmap received string');
  };
}

/** @internal */
type StackItem = {
  /** Currently selected chunks */
  chunks: string[];
  /** Index corresponding to the last chunk (end + 1) */
  endIndexChunks: number;
  /** Where to start the next chunk */
  nextStartIndex: number;
};
