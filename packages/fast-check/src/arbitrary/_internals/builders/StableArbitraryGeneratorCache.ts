import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { Map, safeMapGet, safeMapSet, safePush } from '../../../utils/globals.js';

const safeArrayIsArray = Array.isArray;
const safeObjectKeys = Object.keys;
const safeObjectIs = Object.is;

type ArbitraryBuilder = () => Arbitrary<unknown>;
type MemoedEntry<T = unknown> = { args: unknown[]; value: Arbitrary<T> };
export type ArbitraryGeneratorCache = <T, TArgs extends unknown[]>(
  builder: (...params: TArgs) => Arbitrary<T>,
  args: TArgs,
) => Arbitrary<T>;

export function buildStableArbitraryGeneratorCache(
  isEqual: (v1: unknown, v2: unknown) => boolean,
): ArbitraryGeneratorCache {
  // No need to choose a weak container (such as WeakMap) as the recommendation
  // would be to pass a stable builder function so the ref might never die and
  // thus never be garbage-collected.
  const previousCallsPerBuilder = new Map<ArbitraryBuilder, MemoedEntry[]>();

  return function stableArbitraryGeneratorCache<T, TArgs extends unknown[]>(
    builder: (...args: TArgs) => Arbitrary<T>,
    args: TArgs,
  ): Arbitrary<T> {
    const entriesForBuilder = safeMapGet(previousCallsPerBuilder, builder);
    if (entriesForBuilder === undefined) {
      const newValue = builder(...args);
      safeMapSet(previousCallsPerBuilder, builder, [{ args, value: newValue }]);
      return newValue;
    }
    const safeEntriesForBuilder = entriesForBuilder as MemoedEntry<T>[];
    for (const entry of safeEntriesForBuilder) {
      if (isEqual(args, entry.args)) {
        return entry.value;
      }
    }
    const newValue = builder(...args);
    safePush(safeEntriesForBuilder, { args, value: newValue });
    return newValue;
  };
}

export function naiveIsEqual(v1: unknown, v2: unknown): boolean {
  if (v1 !== null && typeof v1 === 'object' && v2 !== null && typeof v2 === 'object') {
    if (safeArrayIsArray(v1)) {
      if (!safeArrayIsArray(v2)) return false;
      if (v1.length !== v2.length) return false;
    } else if (safeArrayIsArray(v2)) {
      return false;
    }

    if (safeObjectKeys(v1).length !== safeObjectKeys(v2).length) {
      return false;
    }
    for (const index in v1) {
      if (!(index in v2)) {
        return false;
      }
      if (!naiveIsEqual((v1 as any)[index], (v2 as any)[index])) {
        return false;
      }
    }
    return true;
  } else {
    return safeObjectIs(v1, v2);
  }
}
