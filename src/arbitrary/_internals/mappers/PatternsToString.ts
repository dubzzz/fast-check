import { NextArbitrary } from '../../../check/arbitrary/definition/NextArbitrary';
import { MaxLengthUpperBound } from '../helpers/MaxLengthFromMinLength';
import { StringSharedConstraints } from '../../_shared/StringSharedConstraints';

/** @internal - tab is supposed to be composed of valid entries extracted from the source arbitrary */
export function patternsToStringMapper(tab: string[]): string {
  return tab.join('');
}

/** @internal */
export function patternsToStringUnmapperFor(
  patternsArb: NextArbitrary<string>,
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
    const maxLength = constraints.maxLength !== undefined ? constraints.maxLength : MaxLengthUpperBound;
    if (value.length === 0) {
      if (minLength > 0) {
        throw new Error('Unable to unmap received string');
      }
      return [];
    }

    // DFS analysis
    // Structure of an item within the stack:
    // - endIndexChunks: where we are in the analysis
    // - chunks: chunks computed and extracted up-to endIndexChunks
    // - nextStartIndex: where to start next time (mostly needed as we want to go deep first)
    const stack: StackItem[] = [{ endIndexChunks: 0, nextStartIndex: 1, chunks: [] }];
    while (stack.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const last = stack.pop()!;

      // Going deeper in the tree
      // TODO - Use larger chunks first instead of small ones then large ones
      for (let index = last.nextStartIndex; index <= value.length; ++index) {
        const chunk = value.substring(last.endIndexChunks, index);
        if (patternsArb.canShrinkWithoutContext(chunk)) {
          const newChunks = last.chunks.concat([chunk]);
          if (index === value.length) {
            if (newChunks.length < minLength || newChunks.length > maxLength) {
              break; // =continue as we already reach the last index of the for-loop
            }
            // TODO - Rely on dynamic programming tricks not to retry from already investigated indices
            return newChunks; // we found a full match
          }
          // Pushed in case we need to try for next indices
          // Actually it corresponds to moving to the next index in the for-loop BUT as we want to go deep first,
          // we stop the iteration of the current for-loop via a break and delay the analysis for next index for later
          // with this push.
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
