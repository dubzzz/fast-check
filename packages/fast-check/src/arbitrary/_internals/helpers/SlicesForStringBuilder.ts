import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';

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

export function createSlicesForString(
  charArbitrary: Arbitrary<string>,
  stringSplitter: (value: string) => string[]
): string[][] {
  const slicesForString: string[][] = dangerousStrings
    .map((dangerous) => {
      try {
        return stringSplitter(dangerous);
      } catch (err) {
        return [];
      }
    })
    .filter((entry) => entry.length > 0 && entry.every((c) => charArbitrary.canShrinkWithoutContext(c)));

  return slicesForString;
}
