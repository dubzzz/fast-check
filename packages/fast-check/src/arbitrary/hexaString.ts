import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import type { ArrayConstraintsInternal } from './array';
import { array } from './array';
import { hexa } from './hexa';
import type { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { codePointsToStringMapper, codePointsToStringUnmapper } from './_internals/mappers/CodePointsToString';
import { createSlicesForStringLegacy } from './_internals/helpers/SlicesForStringBuilder';
export type { StringSharedConstraints } from './_shared/StringSharedConstraints';

const safeObjectAssign = Object.assign;

/**
 * For strings of {@link hexa}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @deprecated Please use ${@link string} with `fc.string({ unit: fc.constantFrom(...'0123456789abcdef'), ...constraints })` instead
 * @remarks Since 0.0.1
 * @public
 */
function hexaString(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  const charArbitrary = hexa();
  const experimentalCustomSlices = createSlicesForStringLegacy(charArbitrary, codePointsToStringUnmapper);
  // TODO - Move back to object spreading as soon as we bump support from es2017 to es2018+
  const enrichedConstraints: ArrayConstraintsInternal<string> = safeObjectAssign(safeObjectAssign({}, constraints), {
    experimentalCustomSlices,
  });
  return array(charArbitrary, enrichedConstraints).map(codePointsToStringMapper, codePointsToStringUnmapper);
}
export { hexaString };
