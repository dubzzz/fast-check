import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import type { ArrayConstraintsInternal } from './array';
import { array } from './array';
import { fullUnicode } from './fullUnicode';
import type { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { codePointsToStringMapper, codePointsToStringUnmapper } from './_internals/mappers/CodePointsToString';
import { createSlicesForStringLegacy } from './_internals/helpers/SlicesForStringBuilder';
export type { StringSharedConstraints } from './_shared/StringSharedConstraints';

const safeObjectAssign = Object.assign;

/**
 * For strings of {@link fullUnicode}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @deprecated Please use ${@link string} with `fc.string({ unit: 'grapheme', ...constraints })` or `fc.string({ unit: 'binary', ...constraints })` instead
 * @remarks Since 0.0.11
 * @public
 */
export function fullUnicodeString(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  const charArbitrary = fullUnicode();
  const experimentalCustomSlices = createSlicesForStringLegacy(charArbitrary, codePointsToStringUnmapper);
  // TODO - Move back to object spreading as soon as we bump support from es2017 to es2018+
  const enrichedConstraints: ArrayConstraintsInternal<string> = safeObjectAssign(safeObjectAssign({}, constraints), {
    experimentalCustomSlices,
  });
  return array(charArbitrary, enrichedConstraints).map(codePointsToStringMapper, codePointsToStringUnmapper);
}
