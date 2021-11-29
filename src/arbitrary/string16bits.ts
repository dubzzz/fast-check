import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { array } from './array';
import { char16bits } from './char16bits';
import { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { charsToStringMapper, charsToStringUnmapper } from './_internals/mappers/CharsToString';
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
  return array(char16bits(), constraints).map(charsToStringMapper, charsToStringUnmapper);
}
