import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { array } from './array';
import { fullUnicode } from './fullUnicode';
import { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { codePointsToStringMapper, codePointsToStringUnmapper } from './_internals/mappers/CodePointsToString';
export { StringSharedConstraints } from './_shared/StringSharedConstraints';

/**
 * For strings of {@link fullUnicode}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.11
 * @public
 */
export function fullUnicodeString(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  return array(fullUnicode(), constraints).map(codePointsToStringMapper, codePointsToStringUnmapper);
}
