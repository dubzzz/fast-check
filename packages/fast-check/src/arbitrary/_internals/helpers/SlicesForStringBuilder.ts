import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { safePush } from '../../../utils/globals';

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
function computeCandidateString(
  dangerous: string,
  charArbitrary: Arbitrary<string>,
  stringSplitter: (value: string) => string[]
): string[] | undefined {
  let candidate: string[];
  try {
    candidate = stringSplitter(dangerous);
  } catch (err) {
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
export function createSlicesForString(
  charArbitrary: Arbitrary<string>,
  stringSplitter: (value: string) => string[]
): string[][] {
  const slicesForString: string[][] = [];
  for (const dangerous of dangerousStrings) {
    const candidate = computeCandidateString(dangerous, charArbitrary, stringSplitter);
    if (candidate !== undefined) {
      safePush(slicesForString, candidate);
    }
  }
  return slicesForString;
}
