import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { StringSharedConstraints, StringFullConstraintsDefinition } from './_internals/builders/StringArbitraryBuilder';
import { buildBase64StringArbitrary } from './_internals/builders/Base64StringArbitraryBuilder';
export { StringSharedConstraints } from './_internals/builders/StringArbitraryBuilder';

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
  return buildBase64StringArbitrary(...args);
}
export { base64String };
