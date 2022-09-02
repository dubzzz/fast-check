import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { array, ArrayConstraintsInternal } from './array';
import { char16bits } from './char16bits';
import { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { charsToStringMapper, charsToStringUnmapper } from './_internals/mappers/CharsToString';
import { createSlicesForString } from './_internals/helpers/SlicesForStringBuilder';
export { StringSharedConstraints } from './_shared/StringSharedConstraints';

const safeObjectAssign = Object.assign;

/**
 * For strings of {@link char16bits}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.11
 * @public
 */
export function string16bits(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  const charArbitrary = char16bits();
  const experimentalCustomSlices = createSlicesForString(charArbitrary, charsToStringUnmapper);
  // TODO - Move back to object spreading as soon as we bump support from es2017 to es2018+
  const enrichedConstraints: ArrayConstraintsInternal<string> = safeObjectAssign(safeObjectAssign({}, constraints), {
    experimentalCustomSlices,
  });
  return array(charArbitrary, enrichedConstraints).map(charsToStringMapper, charsToStringUnmapper);
}
