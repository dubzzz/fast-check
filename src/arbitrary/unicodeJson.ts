import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { unicodeJsonObject } from './unicodeJsonObject';
import { JsonSharedConstraints } from './_internals/helpers/JsonConstraintsBuilder';

export { JsonSharedConstraints };

/**
 * For any JSON strings with unicode support
 *
 * Keys and string values rely on {@link unicode}
 *
 * @remarks Since 0.0.7
 * @public
 */
function unicodeJson(): Arbitrary<string>;
/**
 * For any JSON strings with unicode support and a maximal depth
 *
 * Keys and string values rely on {@link unicode}
 *
 * @param maxDepth - Maximal depth of the generated objects
 *
 * @deprecated
 * Superceded by `fc.unicodeJson({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.7
 * @public
 */
function unicodeJson(maxDepth: number): Arbitrary<string>;
/**
 * For any JSON strings with unicode support
 *
 * Keys and string values rely on {@link unicode}
 *
 * @param constraints - Constraints to be applied onto the generated instance
 *
 * @remarks Since 2.5.0
 * @public
 */
function unicodeJson(constraints: JsonSharedConstraints): Arbitrary<string>;
function unicodeJson(constraints?: number | JsonSharedConstraints): Arbitrary<string> {
  // Rq: Explicit 'as any' as 'number | JsonConstraints' cannot be passed to 'unicodeJsonObject(number)'
  //     and cannot be passed to 'unicodeJsonObject(JsonConstraints)' (both are too strict)
  const arb = constraints != null ? unicodeJsonObject(constraints as any) : unicodeJsonObject();
  return arb.map(JSON.stringify);
}
export { unicodeJson };
