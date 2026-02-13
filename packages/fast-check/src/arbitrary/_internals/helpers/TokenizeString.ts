import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { safePop, safePush, safeSubstring } from '../../../utils/globals.js';

/**
 * Split a string into valid tokens of patternsArb
 * @internal
 */
export function tokenizeString(
  patternsArb: Arbitrary<string>,
  value: string,
  minLength: number,
  maxLength: number,
): string[] | undefined {
  // First match wins! Possibly not the best match.
  // Empty strings are not considered as valid chunks.
  if (value.length === 0) {
    if (minLength > 0) {
      return undefined;
    }
    return [];
  }
  if (maxLength <= 0) {
    return undefined;
  }

  // DFS analysis
  // Structure of an item within the stack:
  // - endIndexChunks: where we are in the analysis
  // - chunks: chunks computed and extracted up-to endIndexChunks
  // - nextStartIndex: where to start next time (mostly needed as we want to go deep first)
  const stack: StackItem[] = [{ endIndexChunks: 0, nextStartIndex: 1, chunks: [] }];
  while (stack.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const last = safePop(stack)!;

    // Going deeper in the tree
    // TODO - Use larger chunks first instead of small ones then large ones
    for (let index = last.nextStartIndex; index <= value.length; ++index) {
      const chunk = safeSubstring(value, last.endIndexChunks, index);
      if (patternsArb.canShrinkWithoutContext(chunk)) {
        const newChunks = [...last.chunks, chunk];
        if (index === value.length) {
          if (newChunks.length < minLength) {
            break; // =continue as we already reach the last index of the for-loop
          }
          // TODO - Rely on dynamic programming tricks not to retry from already investigated indices
          return newChunks; // we found a full match
        }
        // Pushed in case we need to try for next indices
        // Actually it corresponds to moving to the next index in the for-loop BUT as we want to go deep first,
        // we stop the iteration of the current for-loop via a break and delay the analysis for next index for later
        // with this push.
        safePush(stack, { endIndexChunks: last.endIndexChunks, nextStartIndex: index + 1, chunks: last.chunks });
        // Pushed to go deeper in the tree
        // If it's still acceptable in length
        if (newChunks.length < maxLength) {
          safePush(stack, { endIndexChunks: index, nextStartIndex: index + 1, chunks: newChunks });
        }
        break;
      }
    }
  }
  return undefined;
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
