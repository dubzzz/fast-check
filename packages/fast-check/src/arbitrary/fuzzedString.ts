import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { SuffixTree, START_TOKEN, END_TOKEN } from './_internals/helpers/SuffixTree.js';
import { constant } from './constant.js';
import { oneof } from './oneof.js';

type PreviousToken = string | typeof START_TOKEN;
type NextToken = string | typeof END_TOKEN;

function hitCountToArbitrary<T>(hit: Map<T, number>): Arbitrary<T> {
  const hitArbitraryEntries: { weight: number; arbitrary: Arbitrary<T> }[] = [];
  for (const [value, count] of hit) {
    hitArbitraryEntries.push({ weight: count, arbitrary: constant(value) });
  }
  return oneof(...hitArbitraryEntries);
}

function next(root: SuffixTree, tokens: PreviousToken[], entropyArbitrary: Arbitrary<NextToken>): Arbitrary<string> {
  // Extract eligible next tokens based on current tokens
  // For each of them we associate a weight
  const eligible = new Map<NextToken, number>();
  let index = tokens.length;
  let cursor: SuffixTree = root;
  let maxPossibleValuesWeight = 0;
  while (index > 0) {
    // Treating tokens in [index-1, length]
    index -= 1;
    const nextCursor = cursor.next(tokens[index]);
    if (nextCursor === undefined) {
      break;
    }
    cursor = nextCursor;
    let possibleValuesWeight = 0;
    for (const value of cursor.listPossibleValues()) {
      const count = eligible.get(value.token) ?? 0;
      eligible.set(value.token, count + value.count);
      possibleValuesWeight += value.count;
    }
    maxPossibleValuesWeight = Math.max(maxPossibleValuesWeight, possibleValuesWeight);
  }

  // Create the arbitrary responsible to build the next token
  const nextTokenArbitrary =
    eligible.size === 0
      ? entropyArbitrary // No eligible token, fallback to entropy only
      : oneof({ weight: maxPossibleValuesWeight, arbitrary: hitCountToArbitrary(eligible) }, entropyArbitrary);

  // Create the arbitrary building the resulting string
  return nextTokenArbitrary.chain((nextToken) => {
    if (nextToken === END_TOKEN) {
      return constant(tokens.slice(1).join(''));
    }
    return next(root, [...tokens, nextToken], entropyArbitrary);
  });
}

export function fuzzedString(corpus: string[]): Arbitrary<string> {
  const root = new SuffixTree();
  for (const word of corpus) {
    root.add(word);
  }
  const hit = new Map<NextToken, number>();
  for (const word of corpus) {
    for (const c of word) {
      const count = hit.get(c) ?? 0;
      hit.set(c, count + 1);
    }
    const count = hit.get(END_TOKEN) ?? 0;
    hit.set(END_TOKEN, count + 1);
  }
  return next(root, [START_TOKEN], hitCountToArbitrary(hit));
}
