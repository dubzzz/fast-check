import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { array, ArrayConstraintsInternal } from './array';
import { unicode } from './unicode';
import { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { codePointsToStringMapper, codePointsToStringUnmapper } from './_internals/mappers/CodePointsToString';
import { createSlicesForString } from './_internals/helpers/SlicesForStringBuilder';
export { StringSharedConstraints } from './_shared/StringSharedConstraints';

const safeObjectAssign = Object.assign;

/**
 * For strings of {@link unicode}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.11
 * @public
 */
export function unicodeString(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  const charArbitrary = unicode();
  const experimentalCustomSlices = createSlicesForString(charArbitrary, codePointsToStringUnmapper);
  // TODO - Move back to object spreading as soon as we bump support from es2017 to es2018+
  const enrichedConstraints: ArrayConstraintsInternal<string> = safeObjectAssign(safeObjectAssign({}, constraints), {
    experimentalCustomSlices,
  });
  return array(charArbitrary, enrichedConstraints).map(codePointsToStringMapper, codePointsToStringUnmapper);
}
