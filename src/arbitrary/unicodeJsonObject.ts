import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { unicodeString } from './unicodeString';
import { jsonConstraintsBuilder, JsonSharedConstraints } from './_internals/helpers/JsonConstraintsBuilder';
import { anything } from './anything';

export { JsonSharedConstraints };

/**
 * For any JSON compliant values with unicode support
 *
 * Keys and string values rely on {@link unicode}
 *
 * @remarks Since 1.2.3
 * @public
 */
function unicodeJsonObject(): Arbitrary<unknown>;
/**
 * For any JSON compliant values with unicode support and a maximal depth
 *
 * Keys and string values rely on {@link unicode}
 *
 * @param maxDepth - Maximal depth of the generated values
 *
 * @deprecated
 * Superceded by `fc.unicodeJsonObject({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.2.3
 * @public
 */
function unicodeJsonObject(maxDepth: number): Arbitrary<unknown>;
/**
 * For any JSON compliant values with unicode support
 *
 * Keys and string values rely on {@link unicode}
 *
 * @param constraints - Constraints to be applied onto the generated instance
 *
 * @remarks Since 2.5.0
 * @public
 */
function unicodeJsonObject(constraints: JsonSharedConstraints): Arbitrary<unknown>;
function unicodeJsonObject(constraints?: number | JsonSharedConstraints): Arbitrary<unknown> {
  return anything(jsonConstraintsBuilder(unicodeString(), constraints));
}
export { unicodeJsonObject };
