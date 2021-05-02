import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { array } from './array';
import { base64 } from './base64';
import { maxLengthFromMinLength } from './_internals/helpers/MaxLengthFromMinLength';
import {
  extractStringConstraints,
  StringFullConstraintsDefinition,
  StringSharedConstraints,
} from './_internals/helpers/StringConstraintsExtractor';
import { codePointAwareMapper, codePointAwareUnmapper } from './_internals/mappers/CodePointAware';
import { stringToBase64Mapper, stringToBase64Unmapper } from './_internals/mappers/StringToBase64';
export { StringSharedConstraints } from './_internals/helpers/StringConstraintsExtractor';

/** @internal */
function extractMinMaxConstraints(args: StringFullConstraintsDefinition) {
  const constraints = extractStringConstraints(args);
  const minLength = constraints.minLength !== undefined ? constraints.minLength : 0;
  const maxLength = constraints.maxLength !== undefined ? constraints.maxLength : maxLengthFromMinLength(minLength);
  return { minLength, maxLength };
}

/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @remarks Since 0.0.1
 * @public
 */
function base64String(): Arbitrary<string>;
/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.base64String({maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.1
 * @public
 */
function base64String(maxLength: number): Arbitrary<string>;
/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.base64String({minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function base64String(minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For base64 strings
 *
 * A base64 string will always have a length multiple of 4 (padded with =)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function base64String(constraints: StringSharedConstraints): Arbitrary<string>;
function base64String(...args: StringFullConstraintsDefinition): Arbitrary<string> {
  const constraints = extractMinMaxConstraints(args);
  const unscaledMinLength = constraints.minLength;
  const unscaledMaxLength = constraints.maxLength;

  // base64 length is always a multiple of 4
  const minLength = unscaledMinLength + 3 - ((unscaledMinLength + 3) % 4);
  const maxLength = unscaledMaxLength - (unscaledMaxLength % 4);

  if (minLength > maxLength) throw new Error('Minimal length should be inferior or equal to maximal length');
  if (minLength % 4 !== 0) throw new Error('Minimal length of base64 strings must be a multiple of 4');
  if (maxLength % 4 !== 0) throw new Error('Maximal length of base64 strings must be a multiple of 4');

  return convertFromNext(
    convertToNext(array(base64(), { minLength, maxLength }))
      .map(codePointAwareMapper, codePointAwareUnmapper)
      .map(stringToBase64Mapper, stringToBase64Unmapper)
  );
}
export { base64String };
