import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { array } from './array';
import { hexa } from './hexa';
import { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { codePointsToStringMapper, codePointsToStringUnmapper } from './_internals/mappers/CodePointsToString';
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
  return convertFromNext(
    convertToNext(array(hexa(), constraints)).map(codePointsToStringMapper, codePointsToStringUnmapper)
  );
}
export { hexaString };
