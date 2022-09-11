import { safeApply } from './apply';

// Globals

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SArray: typeof Array = typeof Array !== 'undefined' ? Array : undefined!;
export { SArray as Array };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SBigInt: typeof BigInt = typeof BigInt !== 'undefined' ? BigInt : undefined!;
export { SBigInt as BigInt };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SBigInt64Array: typeof BigInt64Array = typeof BigInt64Array !== 'undefined' ? BigInt64Array : undefined!;
export { SBigInt64Array as BigInt64Array };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SBigUint64Array: typeof BigUint64Array = typeof BigUint64Array !== 'undefined' ? BigUint64Array : undefined!;
export { SBigUint64Array as BigUint64Array };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SBoolean: typeof Boolean = typeof Boolean !== 'undefined' ? Boolean : undefined!;
export { SBoolean as Boolean };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SDate: typeof Date = typeof Date !== 'undefined' ? Date : undefined!;
export { SDate as Date };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SError: typeof Error = typeof Error !== 'undefined' ? Error : undefined!;
export { SError as Error };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SFloat32Array: typeof Float32Array = typeof Float32Array !== 'undefined' ? Float32Array : undefined!;
export { SFloat32Array as Float32Array };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SFloat64Array: typeof Float64Array = typeof Float64Array !== 'undefined' ? Float64Array : undefined!;
export { SFloat64Array as Float64Array };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SInt8Array: typeof Int8Array = typeof Int8Array !== 'undefined' ? Int8Array : undefined!;
export { SInt8Array as Int8Array };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SInt16Array: typeof Int16Array = typeof Int16Array !== 'undefined' ? Int16Array : undefined!;
export { SInt16Array as Int16Array };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SInt32Array: typeof Int32Array = typeof Int32Array !== 'undefined' ? Int32Array : undefined!;
export { SInt32Array as Int32Array };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SNumber: typeof Number = typeof Number !== 'undefined' ? Number : undefined!;
export { SNumber as Number };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SString: typeof String = typeof String !== 'undefined' ? String : undefined!;
export { SString as String };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SSet: typeof Set = typeof Set !== 'undefined' ? Set : undefined!;
export { SSet as Set };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SUint8Array: typeof Uint8Array = typeof Uint8Array !== 'undefined' ? Uint8Array : undefined!;
export { SUint8Array as Uint8Array };
const SUint8ClampedArray: typeof Uint8ClampedArray =
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  typeof Uint8ClampedArray !== 'undefined' ? Uint8ClampedArray : undefined!;
export { SUint8ClampedArray as Uint8ClampedArray };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SUint16Array: typeof Uint16Array = typeof Uint16Array !== 'undefined' ? Uint16Array : undefined!;
export { SUint16Array as Uint16Array };
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const SUint32Array: typeof Uint32Array = typeof Uint32Array !== 'undefined' ? Uint32Array : undefined!;
export { SUint32Array as Uint32Array };
const SencodeURIComponent: typeof encodeURIComponent =
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  typeof encodeURIComponent !== 'undefined' ? encodeURIComponent : undefined!;
export { SencodeURIComponent as encodeURIComponent };

// Various remarks concerning this part of the file:
// - Functions accepting a variadic number of arguments ALWAYS use (...args) instead of (a, b)
//   Some build-ins behave differently for f(a, undefined) and f(a) such as splice, it would reduce such risk
// - The file is very verbose BUT extracting an helper factorizing it kills the performance, so we had to copy-paste
//   the pattern over and over

// Array

const untouchedForEach = Array.prototype.forEach;
const untouchedIndexOf = Array.prototype.indexOf;
const untouchedJoin = Array.prototype.join;
const untouchedMap = Array.prototype.map;
const untouchedFilter = Array.prototype.filter;
const untouchedPush = Array.prototype.push;
const untouchedPop = Array.prototype.pop;
const untouchedSplice: (start: number, deleteCount?: number | undefined) => any[] = Array.prototype.splice;
const untouchedSlice = Array.prototype.slice;
const untouchedSort = Array.prototype.sort;
function extractForEach(instance: unknown[]) {
  try {
    return instance.forEach;
  } catch (err) {
    return undefined;
  }
}
function extractIndexOf(instance: readonly unknown[]) {
  try {
    return instance.indexOf;
  } catch (err) {
    return undefined;
  }
}
function extractJoin(instance: unknown[]) {
  try {
    return instance.join;
  } catch (err) {
    return undefined;
  }
}
function extractMap(instance: unknown[]) {
  try {
    return instance.map;
  } catch (err) {
    return undefined;
  }
}
function extractFilter(instance: unknown[]) {
  try {
    return instance.filter;
  } catch (err) {
    return undefined;
  }
}
function extractPush(instance: unknown[]) {
  try {
    return instance.push;
  } catch (err) {
    return undefined;
  }
}
function extractPop(instance: unknown[]) {
  try {
    return instance.pop;
  } catch (err) {
    return undefined;
  }
}
function extractSplice(instance: unknown[]) {
  try {
    return instance.splice;
  } catch (err) {
    return undefined;
  }
}
function extractSlice(instance: unknown[]) {
  try {
    return instance.slice;
  } catch (err) {
    return undefined;
  }
}
function extractSort(instance: unknown[]) {
  try {
    return instance.sort;
  } catch (err) {
    return undefined;
  }
}
export function safeForEach<T>(instance: T[], fn: (value: T, index: number, array: T[]) => void): void {
  if (extractForEach(instance) === untouchedForEach) {
    return instance.forEach(fn);
  }
  return safeApply(untouchedForEach, instance, [fn]);
}
export function safeIndexOf<T>(
  instance: readonly T[],
  ...args: [searchElement: T, fromIndex?: number | undefined]
): number {
  if (extractIndexOf(instance) === untouchedIndexOf) {
    return instance.indexOf(...args);
  }
  return safeApply(untouchedIndexOf, instance, args);
}
export function safeJoin<T>(instance: T[], ...args: [separator?: string | undefined]): string {
  if (extractJoin(instance) === untouchedJoin) {
    return instance.join(...args);
  }
  return safeApply(untouchedJoin, instance, args);
}
export function safeMap<T, U>(instance: T[], fn: (value: T, index: number, array: T[]) => U): U[] {
  if (extractMap(instance) === untouchedMap) {
    return instance.map(fn);
  }
  return safeApply(untouchedMap, instance, [fn]);
}
export function safeFilter<T, U extends T>(
  instance: T[],
  predicate: ((value: T, index: number, array: T[]) => value is U) | ((value: T, index: number, array: T[]) => unknown)
): U[] {
  if (extractFilter(instance) === untouchedFilter) {
    return instance.filter(predicate as (value: T, index: number, array: T[]) => value is U);
  }
  return safeApply(untouchedFilter, instance, [predicate]);
}
export function safePush<T>(instance: T[], ...args: T[]): number {
  if (extractPush(instance) === untouchedPush) {
    return instance.push(...args);
  }
  return safeApply(untouchedPush, instance, args);
}
export function safePop<T>(instance: T[]): T | undefined {
  if (extractPop(instance) === untouchedPop) {
    return instance.pop();
  }
  return safeApply(untouchedPop, instance, []);
}
export function safeSplice<T>(instance: T[], ...args: [start: number, deleteCount?: number | undefined]): T[] {
  if (extractSplice(instance) === untouchedSplice) {
    return instance.splice(...args);
  }
  return safeApply(untouchedSplice, instance, args);
}
export function safeSlice<T>(instance: T[], ...args: [start?: number | undefined, end?: number | undefined]): T[] {
  if (extractSlice(instance) === untouchedSlice) {
    return instance.slice(...args);
  }
  return safeApply(untouchedSlice, instance, args);
}
export function safeSort<T>(instance: T[], ...args: [compareFn?: ((a: T, b: T) => number) | undefined]): T[] {
  if (extractSort(instance) === untouchedSort) {
    return instance.sort(...args);
  }
  return safeApply(untouchedSort, instance, args);
}

// Date

const untouchedGetTime = Date.prototype.getTime;
const untouchedToISOString = Date.prototype.toISOString;
function extractGetTime(instance: Date) {
  try {
    return instance.getTime;
  } catch (err) {
    return undefined;
  }
}
function extractToISOString(instance: Date) {
  try {
    return instance.toISOString;
  } catch (err) {
    return undefined;
  }
}
export function safeGetTime(instance: Date): number {
  if (extractGetTime(instance) === untouchedGetTime) {
    return instance.getTime();
  }
  return safeApply(untouchedGetTime, instance, []);
}
export function safeToISOString(instance: Date): string {
  if (extractToISOString(instance) === untouchedToISOString) {
    return instance.toISOString();
  }
  return safeApply(untouchedToISOString, instance, []);
}

// Set

const untouchedAdd = Set.prototype.add;
function extractAdd(instance: Set<unknown>) {
  try {
    return instance.add;
  } catch (err) {
    return undefined;
  }
}
export function safeAdd<T>(instance: Set<T>, value: T): Set<T> {
  if (extractAdd(instance) === untouchedAdd) {
    return instance.add(value);
  }
  return safeApply(untouchedAdd, instance, [value]);
}

// String

const untouchedSplit: (separator: string | RegExp, limit?: number | undefined) => string[] = String.prototype.split;
const untouchedStartsWith = String.prototype.startsWith;
const untouchedEndsWith = String.prototype.endsWith;
const untouchedSubstring = String.prototype.substring;
const untouchedToLowerCase = String.prototype.toLowerCase;
const untouchedToUpperCase = String.prototype.toUpperCase;
const untouchedPadStart = String.prototype.padStart;
const untouchedCharCodeAt = String.prototype.charCodeAt;
function extractSplit(instance: string) {
  try {
    return instance.split;
  } catch (err) {
    return undefined;
  }
}
function extractStartsWith(instance: string) {
  try {
    return instance.startsWith;
  } catch (err) {
    return undefined;
  }
}
function extractEndsWith(instance: string) {
  try {
    return instance.endsWith;
  } catch (err) {
    return undefined;
  }
}
function extractSubstring(instance: string) {
  try {
    return instance.substring;
  } catch (err) {
    return undefined;
  }
}
function extractToLowerCase(instance: string) {
  try {
    return instance.toLowerCase;
  } catch (err) {
    return undefined;
  }
}
function extractToUpperCase(instance: string) {
  try {
    return instance.toUpperCase;
  } catch (err) {
    return undefined;
  }
}
function extractPadStart(instance: string) {
  try {
    return instance.padStart;
  } catch (err) {
    return undefined;
  }
}
function extractCharCodeAt(instance: string) {
  try {
    return instance.charCodeAt;
  } catch (err) {
    return undefined;
  }
}
export function safeSplit(
  instance: string,
  ...args: [separator: string | RegExp, limit?: number | undefined]
): string[] {
  if (extractSplit(instance) === untouchedSplit) {
    return instance.split(...args);
  }
  return safeApply(untouchedSplit, instance, args);
}
export function safeStartsWith(
  instance: string,
  ...args: [searchString: string, position?: number | undefined]
): boolean {
  if (extractStartsWith(instance) === untouchedStartsWith) {
    return instance.startsWith(...args);
  }
  return safeApply(untouchedStartsWith, instance, args);
}
export function safeEndsWith(
  instance: string,
  ...args: [searchString: string, endPosition?: number | undefined]
): boolean {
  if (extractEndsWith(instance) === untouchedEndsWith) {
    return instance.endsWith(...args);
  }
  return safeApply(untouchedEndsWith, instance, args);
}
export function safeSubstring(instance: string, ...args: [start: number, end?: number | undefined]): string {
  if (extractSubstring(instance) === untouchedSubstring) {
    return instance.substring(...args);
  }
  return safeApply(untouchedSubstring, instance, args);
}
export function safeToLowerCase(instance: string): string {
  if (extractToLowerCase(instance) === untouchedToLowerCase) {
    return instance.toLowerCase();
  }
  return safeApply(untouchedToLowerCase, instance, []);
}
export function safeToUpperCase(instance: string): string {
  if (extractToUpperCase(instance) === untouchedToUpperCase) {
    return instance.toUpperCase();
  }
  return safeApply(untouchedToUpperCase, instance, []);
}
export function safePadStart(instance: string, ...args: [maxLength: number, fillString?: string | undefined]): string {
  if (extractPadStart(instance) === untouchedPadStart) {
    return instance.padStart(...args);
  }
  return safeApply(untouchedPadStart, instance, args);
}
export function safeCharCodeAt(instance: string, index: number): number {
  if (extractCharCodeAt(instance) === untouchedCharCodeAt) {
    return instance.charCodeAt(index);
  }
  return safeApply(untouchedCharCodeAt, instance, [index]);
}

// Number

const untouchedNumberToString = Number.prototype.toString;
function extractNumberToString(instance: number) {
  try {
    return instance.toString;
  } catch (err) {
    return undefined;
  }
}
export function safeNumberToString(instance: number, ...args: [radix?: number | undefined]): string {
  if (extractNumberToString(instance) === untouchedNumberToString) {
    return instance.toString(...args);
  }
  return safeApply(untouchedNumberToString, instance, args);
}

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
