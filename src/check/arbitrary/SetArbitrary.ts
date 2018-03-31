import { ArrayArbitrary } from './ArrayArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import Shrinkable from './definition/Shrinkable';

function subArrayContains<T>(tab: T[], upperBound: number, includeValue: (v: T) => boolean): boolean {
  for (let idx = 0; idx < upperBound; ++idx) {
    if (includeValue(tab[idx])) return true;
  }
  return false;
}

function swap<T>(tab: T[], idx1: number, idx2: number): void {
  const temp = tab[idx1];
  tab[idx1] = tab[idx2];
  tab[idx2] = temp;
}

function buildCompareFilter<T>(compare: (a: T, b: T) => boolean): ((tab: Shrinkable<T>[]) => Shrinkable<T>[]) {
  return (tab: Shrinkable<T>[]): Shrinkable<T>[] => {
    let finalLength = tab.length;
    for (let idx = tab.length - 1; idx != -1; --idx) {
      if (subArrayContains(tab, idx, t => compare(t.value, tab[idx].value))) {
        --finalLength;
        swap(tab, idx, finalLength);
      }
    }
    return tab.slice(0, finalLength);
  };
}

function set<T>(arb: Arbitrary<T>): Arbitrary<T[]>;
function set<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>;
function set<T>(arb: Arbitrary<T>, minLength: number, maxLength: number): Arbitrary<T[]>;
function set<T>(arb: Arbitrary<T>, compare: (a: T, b: T) => boolean): Arbitrary<T[]>;
function set<T>(arb: Arbitrary<T>, maxLength: number, compare: (a: T, b: T) => boolean): Arbitrary<T[]>;
function set<T>(
  arb: Arbitrary<T>,
  minLength: number,
  maxLength: number,
  compare: (a: T, b: T) => boolean
): Arbitrary<T[]>;
function set<T>(
  arb: Arbitrary<T>,
  aLength?: number | ((a: T, b: T) => boolean),
  bLength?: number | ((a: T, b: T) => boolean),
  compareFn?: (a: T, b: T) => boolean
): Arbitrary<T[]> {
  const minLength: number = bLength == null || typeof bLength !== 'number' ? 0 : (aLength as number);
  const maxLength: number =
    aLength == null || typeof aLength !== 'number' ? 10 : typeof bLength === 'number' ? bLength : aLength;
  const compare =
    compareFn != null
      ? compareFn
      : typeof bLength === 'function'
        ? (bLength as (a: T, b: T) => boolean)
        : typeof aLength === 'function' ? (aLength as (a: T, b: T) => boolean) : (a: T, b: T) => a === b;

  const arrayArb = new ArrayArbitrary<T>(arb, minLength, maxLength, buildCompareFilter(compare));
  if (minLength === 0) return arrayArb;
  return arrayArb.filter(tab => tab.length >= minLength);
}

export { set, buildCompareFilter };
