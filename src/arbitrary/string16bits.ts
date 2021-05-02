import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { array } from './array';
import { char16bits } from './char16bits';
import {
  extractStringConstraints,
  StringFullConstraintsDefinition,
  StringSharedConstraints,
} from './_internals/helpers/StringConstraintsExtractor';
import { notCodePointAwareMapper, notCodePointAwareUnmapper } from './_internals/mappers/NotCodePointAware';
export { StringSharedConstraints } from './_internals/helpers/StringConstraintsExtractor';

/**
 * For strings of {@link char16bits}
 * @remarks Since 0.0.11
 * @public
 */
function string16bits(): Arbitrary<string>;
/**
 * For strings of {@link char16bits}
 *
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.string16bits({maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function string16bits(maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link char16bits}
 *
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.string16bits({minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function string16bits(minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For strings of {@link char16bits}
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function string16bits(constraints: StringSharedConstraints): Arbitrary<string>;
function string16bits(...args: StringFullConstraintsDefinition): Arbitrary<string> {
  const constraints = extractStringConstraints(args);
  return convertFromNext(
    convertToNext(array(char16bits(), constraints)).map(notCodePointAwareMapper, notCodePointAwareUnmapper)
  );
}
export { string16bits };
