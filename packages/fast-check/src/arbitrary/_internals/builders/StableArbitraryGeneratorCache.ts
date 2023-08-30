import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';

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
    const entriesForBuilder = previousCallsPerBuilder.get(builder);
    if (entriesForBuilder === undefined) {
      const newValue = builder(...args);
      previousCallsPerBuilder.set(builder, [{ args, value: newValue }]);
      return newValue;
    }
    const safeEntriesForBuilder = entriesForBuilder as MemoedEntry<T>[];
    for (const entry of safeEntriesForBuilder) {
      if (isEqual(args, entry.args)) {
        return entry.value;
      }
    }
    const newValue = builder(...args);
    safeEntriesForBuilder.push({ args, value: newValue });
    return newValue;
  };
}

export function naiveIsEqual(v1: unknown, v2: unknown): boolean {
  if (v1 !== null && typeof v1 === 'object' && v2 !== null && typeof v2 === 'object') {
    if (Array.isArray(v1)) {
      if (!Array.isArray(v2)) return false;
      if (v1.length !== v2.length) return false;
    } else if (Array.isArray(v2)) {
      return false;
    }

    if (Object.keys(v1).length !== Object.keys(v2).length) {
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
    return Object.is(v1, v2);
  }
}
