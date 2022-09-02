import { buildSafeMethod, safeApply } from './apply';

// Array
export const safeForEach = buildSafeMethod(Array, 'forEach') as <T>(
  instance: T[],
  fn: (value: T, index: number, array: T[]) => void
) => void;
export const safeIndexOf = buildSafeMethod(Array, 'indexOf') as <T>(
  instance: readonly T[],
  searchElement: T,
  fromIndex?: number | undefined
) => number;
export const safeJoin = buildSafeMethod(Array, 'join') as <T>(instance: T[], separator?: string | undefined) => string;
export const safeMap = buildSafeMethod(Array, 'map') as <T, U>(
  instance: T[],
  fn: (value: T, index: number, array: T[]) => U
) => U[];
export const safeFilter = buildSafeMethod(Array, 'filter') as <T, U extends T>(
  instance: T[],
  ...args:
    | [predicate: (value: T, index: number, array: T[]) => value is U]
    | [predicate: (value: T, index: number, array: T[]) => unknown]
) => U[];
export const safePush = buildSafeMethod(Array, 'push') as <T>(instance: T[], ...args: T[]) => number;
export const safePop = buildSafeMethod(Array, 'pop') as <T>(instance: T[]) => T | undefined;
export const safeSplice = buildSafeMethod(Array, 'splice') as <T>(
  instance: T[],
  start: number,
  deleteCount?: number | undefined
) => T[];
export const safeSlice = buildSafeMethod(Array, 'slice') as <T>(
  instance: T[],
  start?: number | undefined,
  end?: number | undefined
) => T[];
export const safeSort = buildSafeMethod(Array, 'sort') as <T>(
  instance: T[],
  compareFn?: ((a: T, b: T) => number) | undefined
) => T[];

// Date
export const safeGetTime = buildSafeMethod(Date, 'getTime');
export const safeToISOString = buildSafeMethod(Date, 'toISOString');

// Set
export const safeAdd = buildSafeMethod(Set, 'add') as <T>(instance: Set<T>, ...args: [T]) => Set<T>;

// String
export const safeSplit = buildSafeMethod(String, 'split') as (
  instance: string,
  separator: string | RegExp,
  limit?: number | undefined
) => string[];
export const safeStartsWith = buildSafeMethod(String, 'startsWith');
export const safeEndsWith = buildSafeMethod(String, 'endsWith');
export const safeSubstring = buildSafeMethod(String, 'substring');
export const safeToLowerCase = buildSafeMethod(String, 'toLowerCase');
export const safeToUpperCase = buildSafeMethod(String, 'toUpperCase');
export const safePadStart = buildSafeMethod(String, 'padStart');

// Number
export const safeNumberToString = buildSafeMethod(Number, 'toString');

// Object
// Special case for object as we really want to call the core methods and not derived versions
const untouchedHasOwnProperty = Object.prototype.hasOwnProperty;
const untouchedToString = Object.prototype.toString;
export function safeHasOwnProperty(instance: unknown, v: PropertyKey): boolean {
  return safeApply(untouchedHasOwnProperty, instance, [v]);
}
export function safeToString(instance: unknown): string {
  return safeApply(untouchedToString, instance, []);
}
