import { safeApply } from './apply';

// Array
const untouchedForEach = Array.prototype.forEach;
const untouchedIndexOf = Array.prototype.indexOf;
const untouchedJoin = Array.prototype.join;
const untouchedMap = Array.prototype.map;
const untouchedPush = Array.prototype.push;
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
export function safePush<T>(instance: T[], ...args: T[]): number {
  return safeApply(untouchedPush, instance, args);
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

// String
const untouchedSplit: (separator: string | RegExp, limit?: number | undefined) => string[] = String.prototype.split;

/** @internal */
export function safeSplit(instance: string, ...args: Parameters<typeof untouchedSplit>): string[] {
  return safeApply(untouchedSplit, instance, args);
}
