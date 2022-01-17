/**
 * Shared upper bound for max length of array-like entities handled within fast-check
 *
 * "Every Array object has a non-configurable "length" property whose value is always a nonnegative integer less than 2^32."
 * See {@link https://262.ecma-international.org/11.0/#sec-array-exotic-objects | ECMAScript Specifications}
 *
 * "The String type is the set of all ordered sequences [...] up to a maximum length of 2^53 - 1 elements."
 * See {@link https://262.ecma-international.org/11.0/#sec-ecmascript-language-types-string-type | ECMAScript Specifications}
 *
 * @internal
 */
export const MaxLengthUpperBound = 0x7fffffff;

/**
 * Compute `maxLength` based on `minLength`
 * @internal
 */
export function maxLengthFromMinLength(minLength: number): number {
  return Math.min(2 * minLength + 10, MaxLengthUpperBound);
}
