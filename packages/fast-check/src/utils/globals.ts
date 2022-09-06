import { safeApply } from './apply';

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
export function safeIndexOf<T>(instance: readonly T[], searchElement: T, fromIndex?: number | undefined): number {
  if (extractIndexOf(instance) === untouchedIndexOf) {
    return instance.indexOf(searchElement, fromIndex);
  }
  return safeApply(untouchedIndexOf, instance, [searchElement, fromIndex]);
}
export function safeJoin<T>(instance: T[], separator?: string | undefined): string {
  if (extractJoin(instance) === untouchedJoin) {
    return instance.join(separator);
  }
  return safeApply(untouchedJoin, instance, [separator]);
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
export function safeSplice<T>(instance: T[], start: number, deleteCount?: number | undefined): T[] {
  if (extractSplice(instance) === untouchedSplice) {
    return instance.splice(start, deleteCount);
  }
  return safeApply(untouchedSplice, instance, [start, deleteCount]);
}
export function safeSlice<T>(instance: T[], start?: number | undefined, end?: number | undefined): T[] {
  if (extractSlice(instance) === untouchedSlice) {
    return instance.slice(start, end);
  }
  return safeApply(untouchedSlice, instance, [start, end]);
}
export function safeSort<T>(instance: T[], compareFn?: ((a: T, b: T) => number) | undefined): T[] {
  if (extractSort(instance) === untouchedSort) {
    return instance.sort(compareFn);
  }
  return safeApply(untouchedSort, instance, [compareFn]);
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
export function safeSplit(instance: string, separator: string | RegExp, limit?: number | undefined): string[] {
  if (extractSplit(instance) === untouchedSplit) {
    return instance.split(separator, limit);
  }
  return safeApply(untouchedSplit, instance, [separator, limit]);
}
export function safeStartsWith(instance: string, searchString: string, position?: number | undefined): boolean {
  if (extractStartsWith(instance) === untouchedStartsWith) {
    return instance.startsWith(searchString, position);
  }
  return safeApply(untouchedStartsWith, instance, [searchString, position]);
}
export function safeEndsWith(instance: string, searchString: string, endPosition?: number | undefined): boolean {
  if (extractEndsWith(instance) === untouchedEndsWith) {
    return instance.endsWith(searchString, endPosition);
  }
  return safeApply(untouchedEndsWith, instance, [searchString, endPosition]);
}
export function safeSubstring(instance: string, start: number, end?: number | undefined): string {
  if (extractSubstring(instance) === untouchedSubstring) {
    return instance.substring(start, end);
  }
  return safeApply(untouchedSubstring, instance, [start, end]);
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
export function safePadStart(instance: string, maxLength: number, fillString?: string | undefined): string {
  if (extractPadStart(instance) === untouchedPadStart) {
    return instance.padStart(maxLength, fillString);
  }
  return safeApply(untouchedPadStart, instance, [maxLength, fillString]);
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
export function safeNumberToString(instance: number, radix?: number | undefined): string {
  if (extractNumberToString(instance) === untouchedNumberToString) {
    return instance.toString(radix);
  }
  return safeApply(untouchedNumberToString, instance, [radix]);
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
