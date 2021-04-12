import { NextValue } from '../../../check/arbitrary/definition/NextValue';

/** @internal */
function subArrayContains<T>(tab: T[], upperBound: number, includeValue: (v: T) => boolean): boolean {
  for (let idx = 0; idx < upperBound; ++idx) {
    if (includeValue(tab[idx])) return true;
  }
  return false;
}

/** @internal */
function swap<T>(tab: T[], idx1: number, idx2: number): void {
  const temp = tab[idx1];
  tab[idx1] = tab[idx2];
  tab[idx2] = temp;
}

/**
 * Build a function that will be used to remove all values that are equal given
 * the comparison function compare
 *
 * The produced function takes an array of items as input and alter it (swap items).
 * It returns the array without any duplicates.
 * @internal
 */
export function buildCompareFilter<T>(compare: (a: T, b: T) => boolean): (tab: NextValue<T>[]) => NextValue<T>[] {
  return (tab: NextValue<T>[]): NextValue<T>[] => {
    let finalLength = tab.length;
    for (let idx = tab.length - 1; idx !== -1; --idx) {
      if (subArrayContains(tab, idx, (t) => compare(t.value_, tab[idx].value_))) {
        --finalLength;
        swap(tab, idx, finalLength);
      }
    }
    return tab.slice(0, finalLength);
  };
}
