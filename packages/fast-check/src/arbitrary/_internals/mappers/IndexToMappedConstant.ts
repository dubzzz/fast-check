import { Error, Number, Map, safeMapGet, safeMapSet } from '../../../utils/globals.js';

/** @internal */
const safeObjectIs = Object.is;

/** @internal */
type Entry<T> = { num: number; build: (idInGroup: number) => T };

/** @internal */
export function indexToMappedConstantMapperFor<T>(entries: Entry<T>[]): (choiceIndex: number) => T {
  if (entries.length === 1) {
    // Fast path: with a single entry there is nothing to search for, `from` is always 0
    const entry = entries[0];
    return function indexToMappedConstantMapperSingle(choiceIndex: number): T {
      return entry.build(choiceIndex);
    };
  }
  // Flat parallel arrays: a packed array of numbers for the cumulative start indexes
  // and one array for the associated build functions. Searching over numbers only is
  // faster than going through an array of objects.
  const froms: number[] = [];
  const builds: ((idInGroup: number) => T)[] = [];
  let currentFrom = 0;
  for (const entry of entries) {
    froms.push(currentFrom);
    builds.push(entry.build);
    currentFrom += entry.num;
  }
  return function indexToMappedConstantMapper(choiceIndex: number): T {
    let min = 0;
    let max = froms.length;
    while (max - min > 1) {
      const mid = (min + max) >>> 1; // >>> 1 is the floored half for our positive integers
      if (choiceIndex < froms[mid]) {
        max = mid;
      } else {
        min = mid;
      }
    }
    return builds[min](choiceIndex - froms[min]);
  };
}

/** @internal */
type ReverseMapping = { mapping: Map<unknown, number>; negativeZeroIndex: number | undefined };

/** @internal */
function buildReverseMapping(entries: { num: number; build: (idInGroup: number) => unknown }[]): ReverseMapping {
  const reverseMapping: ReverseMapping = { mapping: new Map(), negativeZeroIndex: undefined };
  let choiceIndex = 0;
  for (let entryIdx = 0; entryIdx !== entries.length; ++entryIdx) {
    const entry = entries[entryIdx];
    for (let idxInEntry = 0; idxInEntry !== entry.num; ++idxInEntry) {
      const value = entry.build(idxInEntry);
      // Remark:
      // >  Ideally we'd have used `Object.is(value, -0)` but for an unknown reason
      // >  when using node 10 in some very rare circumstances we get: -5e-324 is -0.
      // >  The scenario to reproduce the issue is very complex as it requires this code
      // >  and probably others to be run multiple times before triggering the bug.
      // >  See: https://github.com/dubzzz/fast-check/issues/1841
      // >  Seems to be related to: https://bugs.chromium.org/p/chromium/issues/detail?id=903043&q=903043&can=2
      // >  Fixed by: https://github.com/v8/v8/commit/56f6a763c27d77afbee997a50baa34996e97ba40
      if (value === 0 && 1 / value === Number.NEGATIVE_INFINITY) {
        reverseMapping.negativeZeroIndex = choiceIndex;
      } else {
        safeMapSet(reverseMapping.mapping, value, choiceIndex);
      }
      ++choiceIndex;
    }
  }
  return reverseMapping;
}

/** @internal */
export function indexToMappedConstantUnmapperFor<T>(
  entries: { num: number; build: (idInGroup: number) => T }[],
): (value: unknown) => number {
  let reverseMapping: ReverseMapping | null = null;
  return function indexToMappedConstantUnmapper(value: unknown): number {
    if (reverseMapping === null) {
      reverseMapping = buildReverseMapping(entries);
    }
    const choiceIndex = safeObjectIs(value, -0)
      ? reverseMapping.negativeZeroIndex
      : safeMapGet(reverseMapping.mapping, value);
    if (choiceIndex === undefined) {
      throw new Error('Unknown value encountered cannot be built using this mapToConstant');
    }
    return choiceIndex;
  };
}
