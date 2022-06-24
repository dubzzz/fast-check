import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { array, ArrayConstraintsInternal } from './array';
import { char16bits } from './char16bits';
import { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { charsToStringMapper, charsToStringUnmapper } from './_internals/mappers/CharsToString';
import { createSlicesForStringBuilder } from './_internals/helpers/SlicesForStringBuilder';
export { StringSharedConstraints } from './_shared/StringSharedConstraints';

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
  const slicesBuilder = createSlicesForStringBuilder(charArbitrary, charsToStringUnmapper);
  const enrichedConstraints: ArrayConstraintsInternal<string> = { ...constraints, getCustomSlices: slicesBuilder };
  return array(charArbitrary, enrichedConstraints).map(charsToStringMapper, charsToStringUnmapper);
}
