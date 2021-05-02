import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { array } from './array';
import { unicode } from './unicode';
import {
  extractStringConstraints,
  StringFullConstraintsDefinition,
  StringSharedConstraints,
} from './_internals/helpers/StringConstraintsExtractor';
import { codePointAwareMapper, codePointAwareUnmapper } from './_internals/mappers/CodePointAware';
export { StringSharedConstraints } from './_internals/helpers/StringConstraintsExtractor';

/**
 * For strings of {@link unicode}
 * @remarks Since 0.0.11
 * @public
 */
function unicodeString(): Arbitrary<string>;
/**
 * For strings of {@link unicode}
 *
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.unicodeString({maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function unicodeString(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link unicode}
 *
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.unicodeString({minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function unicodeString(minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link unicode}
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function unicodeString(constraints: StringSharedConstraints): Arbitrary<string>;
function unicodeString(...args: StringFullConstraintsDefinition): Arbitrary<string> {
  const constraints = extractStringConstraints(args);
  return convertFromNext(
    convertToNext(array(unicode(), constraints)).map(codePointAwareMapper, codePointAwareUnmapper)
  );
}
export { unicodeString };
