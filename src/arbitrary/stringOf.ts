import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { array } from './array';
import {
  extractStringConstraints,
  StringFullConstraintsDefinition,
  StringSharedConstraints,
} from './_internals/helpers/StringConstraintsExtractor';
import { stringOfMapper, stringOfUnmapperFor } from './_internals/mappers/StringOf';
export { StringSharedConstraints } from './_internals/helpers/StringConstraintsExtractor';

/**
 * For strings using the characters produced by `charArb`
 *
 * @param charArb - Arbitrary able to generate random strings (possibly multiple characters)
 *
 * @remarks Since 1.1.3
 * @public
 */
function stringOf(charArb: Arbitrary<string>): Arbitrary<string>;
/**
 * For strings using the characters produced by `charArb`
 *
 * @param charArb - Arbitrary able to generate random strings (possibly multiple characters)
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.stringOf(charArb, {maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.1.3
 * @public
 */
function stringOf(charArb: Arbitrary<string>, maxLength: number): Arbitrary<string>;
/**
 * For strings using the characters produced by `charArb`
 *
 * @param charArb - Arbitrary able to generate random strings (possibly multiple characters)
 * @param minLength - Lower bound of the generated string length
 * @param maxLength - Upper bound of the generated string length
 *
 * @deprecated
 * Superceded by `fc.stringOf(charArb, {minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.1.3
 * @public
 */
function stringOf(charArb: Arbitrary<string>, minLength: number, maxLength: number): Arbitrary<string>;
/**
 * For strings using the characters produced by `charArb`
 *
 * @param charArb - Arbitrary able to generate random strings (possibly multiple characters)
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function stringOf(charArb: Arbitrary<string>, constraints: StringSharedConstraints): Arbitrary<string>;
function stringOf(charArb: Arbitrary<string>, ...args: StringFullConstraintsDefinition): Arbitrary<string> {
  const constraints = extractStringConstraints(args);
  return convertFromNext(
    convertToNext(array(charArb, constraints)).map(
      stringOfMapper,
      stringOfUnmapperFor(convertToNext(charArb), constraints)
    )
  );
}
export { stringOf };
