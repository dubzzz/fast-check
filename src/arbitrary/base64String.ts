import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { array } from './array';
import { base64 } from './base64';
import { MaxLengthUpperBound } from './_internals/helpers/MaxLengthFromMinLength';
import { StringSharedConstraints } from './_shared/StringSharedConstraints';
import { codePointsToStringMapper, codePointsToStringUnmapper } from './_internals/mappers/CodePointsToString';
import { stringToBase64Mapper, stringToBase64Unmapper } from './_internals/mappers/StringToBase64';
export { StringSharedConstraints } from './_shared/StringSharedConstraints';

/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
function base64String(constraints: StringSharedConstraints = {}): Arbitrary<string> {
  const { minLength: unscaledMinLength = 0, maxLength: unscaledMaxLength = MaxLengthUpperBound, size } = constraints;

  const minLength = unscaledMinLength + 3 - ((unscaledMinLength + 3) % 4);
  const maxLength = unscaledMaxLength - (unscaledMaxLength % 4);
  const requestedSize = constraints.maxLength === undefined && size === undefined ? '=' : size;

  if (minLength > maxLength) throw new Error('Minimal length should be inferior or equal to maximal length');
  if (minLength % 4 !== 0) throw new Error('Minimal length of base64 strings must be a multiple of 4');
  if (maxLength % 4 !== 0) throw new Error('Maximal length of base64 strings must be a multiple of 4');

  return convertFromNext(
    convertToNext(array(base64(), { minLength, maxLength, size: requestedSize }))
      .map(codePointsToStringMapper, codePointsToStringUnmapper)
      .map(stringToBase64Mapper, stringToBase64Unmapper)
  );
}
export { base64String };
