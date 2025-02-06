import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import type { ArrayConstraintsInternal } from './array';
import { array } from './array';
import { MaxLengthUpperBound } from './_internals/helpers/MaxLengthFromMinLength';
import type { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { codePointsToStringMapper, codePointsToStringUnmapper } from './_internals/mappers/CodePointsToString';
import { stringToBase64Mapper, stringToBase64Unmapper } from './_internals/mappers/StringToBase64';
import { createSlicesForStringLegacy } from './_internals/helpers/SlicesForStringBuilder';
import { integer } from './integer';
import { Error, safeCharCodeAt } from '../utils/globals';
export type { StringSharedConstraints } from './_shared/StringSharedConstraints';

const safeStringFromCharCode = String.fromCharCode;

/** @internal */
function base64Mapper(v: number) {
  if (v < 26) return safeStringFromCharCode(v + 65); // A-Z
  if (v < 52) return safeStringFromCharCode(v + 97 - 26); // a-z
  if (v < 62) return safeStringFromCharCode(v + 48 - 52); // 0-9
  return v === 62 ? '+' : '/'; // 43, 47
}

/** @internal */
function base64Unmapper(s: unknown) {
  if (typeof s !== 'string' || s.length !== 1) {
    throw new Error('Invalid entry');
  }
  const v = safeCharCodeAt(s, 0);
  if (v >= 65 && v <= 90) return v - 65; // A-Z
  if (v >= 97 && v <= 122) return v - 97 + 26; // a-z
  if (v >= 48 && v <= 57) return v - 48 + 52; // 0-9
  return v === 43 ? 62 : v === 47 ? 63 : -1; // +/
}

/** @internal */
function base64() {
  return integer({ min: 0, max: 63 }).map(base64Mapper, base64Unmapper);
}

/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
function base64String(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  const { minLength: unscaledMinLength = 0, maxLength: unscaledMaxLength = MaxLengthUpperBound, size } = constraints;

  const minLength = unscaledMinLength + 3 - ((unscaledMinLength + 3) % 4);
  const maxLength = unscaledMaxLength - (unscaledMaxLength % 4);
  const requestedSize = constraints.maxLength === undefined && size === undefined ? '=' : size;

  if (minLength > maxLength) throw new Error('Minimal length should be inferior or equal to maximal length');
  if (minLength % 4 !== 0) throw new Error('Minimal length of base64 strings must be a multiple of 4');
  if (maxLength % 4 !== 0) throw new Error('Maximal length of base64 strings must be a multiple of 4');

  const charArbitrary = base64();
  const experimentalCustomSlices = createSlicesForStringLegacy(charArbitrary, codePointsToStringUnmapper);
  const enrichedConstraints: ArrayConstraintsInternal<string> = {
    minLength,
    maxLength,
    size: requestedSize,
    experimentalCustomSlices,
  };
  return array(charArbitrary, enrichedConstraints)
    .map(codePointsToStringMapper, codePointsToStringUnmapper)
    .map(stringToBase64Mapper, stringToBase64Unmapper);
}
export { base64String };
