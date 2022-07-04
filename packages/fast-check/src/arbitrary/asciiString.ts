import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { array, ArrayConstraintsInternal } from './array';
import { ascii } from './ascii';
import { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { codePointsToStringMapper, codePointsToStringUnmapper } from './_internals/mappers/CodePointsToString';
import { createSlicesForString } from './_internals/helpers/SlicesForStringBuilder';
export { StringSharedConstraints } from './_shared/StringSharedConstraints';

/**
 * For strings of {@link ascii}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
export function asciiString(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  const charArbitrary = ascii();
  const experimentalCustomSlices = createSlicesForString(charArbitrary, codePointsToStringUnmapper);
  const enrichedConstraints: ArrayConstraintsInternal<string> = { ...constraints, experimentalCustomSlices };
  return array(charArbitrary, enrichedConstraints).map(codePointsToStringMapper, codePointsToStringUnmapper);
}
