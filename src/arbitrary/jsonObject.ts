import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { string } from './string';
import { jsonConstraintsBuilder, JsonSharedConstraints, JsonValue } from './_internals/helpers/JsonConstraintsBuilder';
import { anything } from './anything';

export { JsonSharedConstraints, JsonValue };

/**
 * For any JSON compliant values
 *
 * Keys and string values rely on {@link string}
 *
 * As `JSON.parse` preserves `-0`, `jsonObject` can also have `-0` as a value.
 * `jsonObject` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.
 *
 * @remarks Since 1.2.3
 * @public
 */
function jsonObject(): Arbitrary<JsonValue>;
/**
 * For any JSON compliant values with a maximal depth
 *
 * Keys and string values rely on {@link string}
 *
 * As `JSON.parse` preserves `-0`, `jsonObject` can also have `-0` as a value.
 * `jsonObject` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.
 *
 * @param maxDepth - Maximal depth of the generated values
 *
 * @deprecated
 * Superceded by `fc.jsonObject({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.2.3
 * @public
 */
function jsonObject(maxDepth: number): Arbitrary<JsonValue>;
/**
 * For any JSON compliant values
 *
 * Keys and string values rely on {@link string}
 *
 * As `JSON.parse` preserves `-0`, `jsonObject` can also have `-0` as a value.
 * `jsonObject` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.
 *
 * @param constraints - Constraints to be applied onto the generated instance
 *
 * @remarks Since 2.5.0
 * @public
 */
function jsonObject(constraints: JsonSharedConstraints): Arbitrary<JsonValue>;
function jsonObject(constraints?: number | JsonSharedConstraints): Arbitrary<JsonValue> {
  return anything(jsonConstraintsBuilder(string(), constraints)) as Arbitrary<JsonValue>;
}
export { jsonObject };
