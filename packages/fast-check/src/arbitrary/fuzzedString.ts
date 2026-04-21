import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import {
  computeEntropyEntriesAt,
  hitCountToArbitrary,
} from './_internals/helpers/FuzzerHelpers.js';
import { MarkovChain, START_TOKEN, END_TOKEN } from './_internals/helpers/MarkovChain.js';
import { constant } from './constant.js';
import { oneof } from './oneof.js';

type PreviousToken = string | typeof START_TOKEN;
type NextToken = string | typeof END_TOKEN;

function next(
  root: MarkovChain,
  tokens: PreviousToken[],
  entropyArbitraryAt: (index: number) => Arbitrary<NextToken>,
): Arbitrary<string> {
  // Extract eligible next tokens based on current tokens
  // For each of them we associate a weight
  const eligible = new Map<NextToken, number>();
  let index = tokens.length;
  let currentNode: MarkovChain = root;
  let maxPossibleValuesWeight = 0;
  while (index > 0) {
    // Treating tokens in [index-1, length]
    index -= 1;
    const nextNode = currentNode.next(tokens[index]);
    if (nextNode === undefined) {
      break;
    }
    currentNode = nextNode;
    let possibleValuesWeight = 0;
    for (const value of currentNode.listPossibleValues()) {
      const count = eligible.get(value.token) ?? 0;
      eligible.set(value.token, count + value.count);
      possibleValuesWeight += value.count;
    }
    maxPossibleValuesWeight = Math.max(maxPossibleValuesWeight, possibleValuesWeight);
  }

  // Create the arbitrary responsible to build the next token
  const entropyArbitrary = entropyArbitraryAt(index);
  const nextTokenArbitrary =
    eligible.size === 0
      ? entropyArbitrary // No eligible token, fallback to entropy only
      : oneof(
          { weight: maxPossibleValuesWeight, arbitrary: hitCountToArbitrary(eligible, END_TOKEN) },
          entropyArbitrary,
        );

  // Create the arbitrary building the resulting string
  return nextTokenArbitrary.chain((nextToken) => {
    if (nextToken === END_TOKEN) {
      return constant(tokens.slice(1).join(''));
    }
    return next(root, [...tokens, nextToken], entropyArbitraryAt);
  });
}

/**
 * For strings built from a corpus of sample strings
 *
 * Generates strings that look similar to the ones provided in the corpus.
 * For truly realistic data, prefer combining fast-check with a fake data library.
 *
 * @param corpus - Array of sample strings used as reference
 *
 * @remarks Since 4.8.0
 * @public
 */
export function fuzzedString(corpus: string[]): Arbitrary<string> {
  const root = new MarkovChain();
  for (const word of corpus) {
    root.add(word);
  }
  const corpusRefined = corpus.map((word) => [...word]);
  const entropyArbitraryAt = (index: number) => {
    const hit = computeEntropyEntriesAt(corpusRefined, END_TOKEN, index);
    return hitCountToArbitrary(hit, END_TOKEN);
  };
  return next(root, [START_TOKEN], entropyArbitraryAt);
}
