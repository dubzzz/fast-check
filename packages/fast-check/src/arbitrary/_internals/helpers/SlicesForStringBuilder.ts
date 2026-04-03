import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import type { StringSharedConstraints } from '../../_shared/StringSharedConstraints.js';
import { patternsToStringUnmapperIsValidLength } from '../mappers/PatternsToString.js';
import { MaxLengthUpperBound } from './MaxLengthFromMinLength.js';
import { tokenizeString } from './TokenizeString.js';

const dangerousStrings = [
  // Default attributes on raw Object (from ({}).*)
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
  '__proto__',
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf',
  // Other classical defaults (from MyClassName.*)
  'apply',
  'arguments',
  'bind',
  'call',
  'caller',
  'length',
  'name',
  'prototype',
  // React
  'key',
  'ref',
];

/** @internal */
function computeCandidateStringLegacy(
  dangerous: string,
  charArbitrary: Arbitrary<string>,
  stringSplitter: (value: string) => string[],
): string[] | undefined {
  let candidate: string[];
  try {
    candidate = stringSplitter(dangerous);
  } catch {
    // No split found for `dangerous`, `dangerous` cannot be shrunk by arrays made of `charArbitrary`
    return undefined;
  }
  for (const entry of candidate) {
    if (!charArbitrary.canShrinkWithoutContext(entry)) {
      // Item `entry` cannot be shrunk by `charArbitrary` thus we cannot keep this candidate
      // Remark: depending on the passed `stringSplitter` this check may already have been done
      return undefined;
    }
  }
  return candidate;
}

/** @internal */
export function createSlicesForStringLegacy(
  charArbitrary: Arbitrary<string>,
  stringSplitter: (value: string) => string[],
): string[][] {
  const slicesForString: string[][] = [];
  for (const dangerous of dangerousStrings) {
    const candidate = computeCandidateStringLegacy(dangerous, charArbitrary, stringSplitter);
    if (candidate !== undefined) {
      slicesForString.push(candidate);
    }
  }
  return slicesForString;
}

/** @internal */
const slicesPerArbitrary = new WeakMap<Arbitrary<string>, string[][]>();

/** @internal */
function createSlicesForStringNoConstraints(charArbitrary: Arbitrary<string>): string[][] {
  const slicesForString: string[][] = [];
  for (const dangerous of dangerousStrings) {
    const candidate = tokenizeString(charArbitrary, dangerous, 0, MaxLengthUpperBound);
    if (candidate !== undefined) {
      slicesForString.push(candidate);
    }
  }
  return slicesForString;
}

/** @internal */
export function createSlicesForString(
  charArbitrary: Arbitrary<string>,
  constraints: StringSharedConstraints,
): string[][] {
  let slices = slicesPerArbitrary.get(charArbitrary);
  if (slices === undefined) {
    slices = createSlicesForStringNoConstraints(charArbitrary);
    slicesPerArbitrary.set(charArbitrary, slices);
  }
  const slicesForConstraints: string[][] = [];
  for (const slice of slices) {
    if (patternsToStringUnmapperIsValidLength(slice, constraints)) {
      slicesForConstraints.push(slice);
    }
  }
  return slicesForConstraints;
}
