import { safeApply } from './apply';

// Globals

const SArray: typeof Array = Array;
export { SArray as Array };
const SBigInt: typeof BigInt = BigInt;
export { SBigInt as BigInt };
const SBigInt64Array: typeof BigInt64Array = BigInt64Array;
export { SBigInt64Array as BigInt64Array };
const SBigUint64Array: typeof BigUint64Array = BigUint64Array;
export { SBigUint64Array as BigUint64Array };
const SBoolean: typeof Boolean = Boolean;
export { SBoolean as Boolean };
const SDate: typeof Date = Date;
export { SDate as Date };
const SError: typeof Error = Error;
export { SError as Error };
const SFloat32Array: typeof Float32Array = Float32Array;
export { SFloat32Array as Float32Array };
const SFloat64Array: typeof Float64Array = Float64Array;
export { SFloat64Array as Float64Array };
const SInt8Array: typeof Int8Array = Int8Array;
export { SInt8Array as Int8Array };
const SInt16Array: typeof Int16Array = Int16Array;
export { SInt16Array as Int16Array };
const SInt32Array: typeof Int32Array = Int32Array;
export { SInt32Array as Int32Array };
const SNumber: typeof Number = Number;
export { SNumber as Number };
const SString: typeof String = String;
export { SString as String };
const SSet: typeof Set = Set;
export { SSet as Set };
const SUint8Array: typeof Uint8Array = Uint8Array;
export { SUint8Array as Uint8Array };
const SUint8ClampedArray: typeof Uint8ClampedArray = Uint8ClampedArray;
export { SUint8ClampedArray as Uint8ClampedArray };
const SUint16Array: typeof Uint16Array = Uint16Array;
export { SUint16Array as Uint16Array };
const SUint32Array: typeof Uint32Array = Uint32Array;
export { SUint32Array as Uint32Array };
const SencodeURIComponent: typeof encodeURIComponent = encodeURIComponent;
export { SencodeURIComponent as encodeURIComponent };
const SMap = Map;
export { SMap as Map };
const SSymbol = Symbol;
export { SSymbol as Symbol };

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
const untouchedSplice: (start: number, deleteCount?: number) => any[] = Array.prototype.splice;
const untouchedSlice = Array.prototype.slice;
const untouchedSort = Array.prototype.sort;
const untouchedEvery = Array.prototype.every;
function extractForEach(instance: unknown[]) {
  try {
    return instance.forEach;
  } catch {
    return undefined;
  }
}
function extractIndexOf(instance: readonly unknown[]) {
  try {
    return instance.indexOf;
  } catch {
    return undefined;
  }
}
function extractJoin(instance: unknown[]) {
  try {
    return instance.join;
  } catch {
    return undefined;
  }
}
function extractMap(instance: unknown[]) {
  try {
    return instance.map;
  } catch {
    return undefined;
  }
}
function extractFilter(instance: unknown[]) {
  try {
    return instance.filter;
  } catch {
    return undefined;
  }
}
function extractPush(instance: unknown[]) {
  try {
    return instance.push;
  } catch {
    return undefined;
  }
}
function extractPop(instance: unknown[]) {
  try {
    return instance.pop;
  } catch {
    return undefined;
  }
}
function extractSplice(instance: unknown[]) {
  try {
    return instance.splice;
  } catch {
    return undefined;
  }
}
function extractSlice(instance: unknown[]) {
  try {
    return instance.slice;
  } catch {
    return undefined;
  }
}
function extractSort(instance: unknown[]) {
  try {
    return instance.sort;
  } catch {
    return undefined;
  }
}
function extractEvery(instance: unknown[]) {
  try {
    return instance.every;
  } catch {
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
  predicate: ((value: T, index: number, array: T[]) => value is U) | ((value: T, index: number, array: T[]) => unknown),
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
export function safeEvery<T>(instance: T[], ...args: [predicate: (value: T) => boolean]): boolean {
  if (extractEvery(instance) === untouchedEvery) {
    return instance.every(...args);
  }
  return safeApply(untouchedEvery, instance, args);
}

// Date

const untouchedGetTime = Date.prototype.getTime;
const untouchedToISOString = Date.prototype.toISOString;
function extractGetTime(instance: Date) {
  try {
    return instance.getTime;
  } catch {
    return undefined;
  }
}
function extractToISOString(instance: Date) {
  try {
    return instance.toISOString;
  } catch {
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
const untouchedHas = Set.prototype.has;
function extractAdd(instance: Set<unknown>) {
  try {
    return instance.add;
  } catch {
    return undefined;
  }
}
function extractHas(instance: Set<unknown>) {
  try {
    return instance.has;
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
export function safeHas<T>(instance: Set<T>, value: T): boolean {
  if (extractHas(instance) === untouchedHas) {
    return instance.has(value);
  }
  return safeApply(untouchedHas, instance, [value]);
}

// WeakMap

const untouchedSet = WeakMap.prototype.set;
const untouchedGet = WeakMap.prototype.get;
function extractSet(instance: WeakMap<object, unknown>) {
  try {
    return instance.set;
  } catch (err) {
    return undefined;
  }
}
function extractGet(instance: WeakMap<object, unknown>) {
  try {
    return instance.get;
  } catch (err) {
    return undefined;
  }
}
export function safeSet<T extends object, U>(instance: WeakMap<T, U>, key: T, value: U): WeakMap<T, U> {
  if (extractSet(instance) === untouchedSet) {
    return instance.set(key, value);
  }
  return safeApply(untouchedSet, instance, [key, value]);
}
export function safeGet<T extends object, U>(instance: WeakMap<T, U>, key: T): U | undefined {
  if (extractGet(instance) === untouchedGet) {
    return instance.get(key);
  }
  return safeApply(untouchedGet, instance, [key]);
}

// Map

const untouchedMapSet = Map.prototype.set;
const untouchedMapGet = Map.prototype.get;
function extractMapSet(instance: Map<unknown, unknown>) {
  try {
    return instance.set;
  } catch (err) {
    return undefined;
  }
}
function extractMapGet(instance: Map<unknown, unknown>) {
  try {
    return instance.get;
  } catch (err) {
    return undefined;
  }
}
export function safeMapSet<T, U>(instance: Map<T, U>, key: T, value: U): Map<T, U> {
  if (extractMapSet(instance) === untouchedMapSet) {
    return instance.set(key, value);
  }
  return safeApply(untouchedMapSet, instance, [key, value]);
}
export function safeMapGet<T, U>(instance: Map<T, U>, key: T): U | undefined {
  if (extractMapGet(instance) === untouchedMapGet) {
    return instance.get(key);
  }
  return safeApply(untouchedMapGet, instance, [key]);
}

// String

const untouchedSplit: (separator: string | RegExp, limit?: number) => string[] = String.prototype.split;
const untouchedStartsWith = String.prototype.startsWith;
const untouchedEndsWith = String.prototype.endsWith;
const untouchedSubstring = String.prototype.substring;
const untouchedToLowerCase = String.prototype.toLowerCase;
const untouchedToUpperCase = String.prototype.toUpperCase;
const untouchedPadStart = String.prototype.padStart;
const untouchedCharCodeAt = String.prototype.charCodeAt;
const untouchedNormalize = String.prototype.normalize;
const untouchedReplace: (pattern: RegExp | string, replacement: string) => string = String.prototype.replace;
function extractSplit(instance: string) {
  try {
    return instance.split;
  } catch {
    return undefined;
  }
}
function extractStartsWith(instance: string) {
  try {
    return instance.startsWith;
  } catch {
    return undefined;
  }
}
function extractEndsWith(instance: string) {
  try {
    return instance.endsWith;
  } catch {
    return undefined;
  }
}
function extractSubstring(instance: string) {
  try {
    return instance.substring;
  } catch {
    return undefined;
  }
}
function extractToLowerCase(instance: string) {
  try {
    return instance.toLowerCase;
  } catch {
    return undefined;
  }
}
function extractToUpperCase(instance: string) {
  try {
    return instance.toUpperCase;
  } catch {
    return undefined;
  }
}
function extractPadStart(instance: string) {
  try {
    return instance.padStart;
  } catch {
    return undefined;
  }
}
function extractCharCodeAt(instance: string) {
  try {
    return instance.charCodeAt;
  } catch {
    return undefined;
  }
}
function extractNormalize(instance: string) {
  try {
    return instance.normalize;
  } catch (err) {
    return undefined;
  }
}
function extractReplace(instance: string) {
  try {
    return instance.replace;
  } catch {
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
export function safeNormalize(instance: string, form: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'): string {
  if (extractNormalize(instance) === untouchedNormalize) {
    return instance.normalize(form);
  }
  return safeApply(untouchedNormalize, instance, [form]);
}
export function safeReplace(instance: string, pattern: RegExp | string, replacement: string): string {
  if (extractReplace(instance) === untouchedReplace) {
    return instance.replace(pattern, replacement);
  }
  return safeApply(untouchedReplace, instance, [pattern, replacement]);
}

// Number

const untouchedNumberToString = Number.prototype.toString;
function extractNumberToString(instance: number) {
  try {
    return instance.toString;
  } catch {
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

// Error

const untouchedErrorToString = Error.prototype.toString;
export function safeErrorToString(instance: Error): string {
  return safeApply(untouchedErrorToString, instance, []);
}
