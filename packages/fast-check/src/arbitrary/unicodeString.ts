import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { array } from './array';
import { unicode } from './unicode';
import { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { codePointsToStringMapper, codePointsToStringUnmapper } from './_internals/mappers/CodePointsToString';
export { StringSharedConstraints } from './_shared/StringSharedConstraints';

/**
 * For strings of {@link unicode}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.11
 * @public
 */
export function unicodeString(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  return array(unicode(), constraints).map(codePointsToStringMapper, codePointsToStringUnmapper);
}
