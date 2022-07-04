import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { array, ArrayConstraintsInternal } from './array';
import { hexa } from './hexa';
import { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { codePointsToStringMapper, codePointsToStringUnmapper } from './_internals/mappers/CodePointsToString';
import { createSlicesForString } from './_internals/helpers/SlicesForStringBuilder';
export { StringSharedConstraints } from './_shared/StringSharedConstraints';

/**
 * For strings of {@link hexa}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
function hexaString(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  const charArbitrary = hexa();
  const experimentalCustomSlices = createSlicesForString(charArbitrary, codePointsToStringUnmapper);
  const enrichedConstraints: ArrayConstraintsInternal<string> = { ...constraints, experimentalCustomSlices };
  return array(charArbitrary, enrichedConstraints).map(codePointsToStringMapper, codePointsToStringUnmapper);
}
export { hexaString };
