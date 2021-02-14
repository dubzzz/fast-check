import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { array } from './array';
import { char } from './char';
import { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { codePointsToStringMapper, codePointsToStringUnmapper } from './_internals/mappers/CodePointsToString';
export { StringSharedConstraints } from './_shared/StringSharedConstraints';

/**
 * For strings of {@link char}
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
export function string(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  return convertFromNext(
    convertToNext(array(char(), constraints)).map(codePointsToStringMapper, codePointsToStringUnmapper)
  );
}
