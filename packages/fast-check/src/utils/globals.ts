import { safeApply } from './apply';

// Array
const untouchedForEach = Array.prototype.forEach;
const untouchedIndexOf = Array.prototype.indexOf;
const untouchedJoin = Array.prototype.join;
const untouchedMap = Array.prototype.map;
const untouchedFilter = Array.prototype.filter;
const untouchedPush = Array.prototype.push;
const untouchedPop = Array.prototype.pop;
const untouchedSplice: <T>(this: T[], start: number, deleteCount?: number | undefined) => T[] = Array.prototype.splice;
const untouchedSlice = Array.prototype.slice;
const untouchedSort = Array.prototype.sort;

/** @internal */
export function safeForEach<T>(instance: T[], ...args: [fn: (value: T, index: number, array: T[]) => void]): void {
  return safeApply(untouchedForEach, instance, args);
}

/** @internal */
export function safeIndexOf<T>(
  instance: readonly T[],
  ...args: [searchElement: any, fromIndex?: number | undefined]
): number {
  return safeApply(untouchedIndexOf, instance, args);
}

/** @internal */
export function safeJoin<T>(instance: T[], ...args: [separator?: string | undefined]): string {
  return safeApply(untouchedJoin, instance, args);
}

/** @internal */
export function safeMap<T, U>(instance: T[], ...args: [fn: (value: T, index: number, array: T[]) => U]): U[] {
  return safeApply(untouchedMap, instance, args);
}

/** @internal */
export function safeFilter<T, U extends T>(
  instance: T[],
  ...args:
    | [predicate: (value: T, index: number, array: T[]) => value is U]
    | [predicate: (value: T, index: number, array: T[]) => unknown]
): U[] {
  return safeApply(untouchedFilter, instance, args);
}

/** @internal */
export function safePush<T>(instance: T[], ...args: T[]): number {
  return safeApply(untouchedPush, instance, args);
}

/** @internal */
export function safePop<T>(instance: T[]): T | undefined {
  return safeApply(untouchedPop, instance, []);
}

/** @internal */
export function safeSplice<T>(instance: T[], ...args: [start: number, deleteCount?: number | undefined]): T[] {
  return safeApply(untouchedSplice, instance, args);
}

/** @internal */
export function safeSlice<T>(instance: T[], ...args: [start?: number | undefined, end?: number | undefined]): T[] {
  return safeApply(untouchedSlice, instance, args);
}

/** @internal */
export function safeSort<T>(instance: T[], ...args: [compareFn?: ((a: any, b: any) => number) | undefined]): T[] {
  return safeApply(untouchedSort, instance, args);
}

// Date
const untouchedGetTime = Date.prototype.getTime;
const untouchedToISOString = Date.prototype.toISOString;

/** @internal */
export function safeGetTime(instance: Date): number {
  return safeApply(untouchedGetTime, instance, []);
}

/** @internal */
export function safeToISOString(instance: Date): string {
  return safeApply(untouchedToISOString, instance, []);
}

// Object
const untouchedHasOwnProperty = Object.prototype.hasOwnProperty;
const untouchedToString = Object.prototype.toString;

/** @internal */
export function safeHasOwnProperty(instance: unknown, v: PropertyKey): boolean {
  return safeApply(untouchedHasOwnProperty, instance, [v]);
}

/** @internal */
export function safeToString(instance: unknown): string {
  return safeApply(untouchedToString, instance, []);
}

// Set
const untouchedAdd = Set.prototype.add;

/** @internal */
export function safeAdd<T>(instance: Set<T>, ...args: [T]): Set<T> {
  return safeApply(untouchedAdd, instance, args);
}

// String
const untouchedSplit: (separator: string | RegExp, limit?: number | undefined) => string[] = String.prototype.split;
const untouchedSubstring = String.prototype.substring;

/** @internal */
export function safeSplit(instance: string, ...args: Parameters<typeof untouchedSplit>): string[] {
  return safeApply(untouchedSplit, instance, args);
}

/** @internal */
export function safeSubstring(instance: string, ...args: Parameters<typeof untouchedSubstring>): string {
  return safeApply(untouchedSubstring, instance, args);
}
