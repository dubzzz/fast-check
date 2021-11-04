import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { jsonValue } from './jsonValue';
import { JsonSharedConstraints } from './_internals/helpers/JsonConstraintsBuilder';

export { JsonSharedConstraints };

/**
 * For any JSON strings
 *
 * Keys and string values rely on {@link string}
 *
 * @remarks Since 0.0.7
 * @public
 */
function json(): Arbitrary<string>;
/**
 * For any JSON strings with a maximal depth
 *
 * Keys and string values rely on {@link string}
 *
 * @param maxDepth - Maximal depth of the generated objects
 *
 * @deprecated
 * Superceded by `fc.json({maxDepth})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.7
 * @public
 */
function json(maxDepth: number): Arbitrary<string>;
/**
 * For any JSON strings
 *
 * Keys and string values rely on {@link string}
 *
 * @param constraints - Constraints to be applied onto the generated instance
 *
 * @remarks Since 2.5.0
 * @public
 */
function json(constraints: JsonSharedConstraints): Arbitrary<string>;
function json(constraints?: number | JsonSharedConstraints): Arbitrary<string> {
  // Rq: Explicit 'as any' as 'number | JsonConstraints' cannot be passed to 'jsonValue(number)'
  //     and cannot be passed to 'jsonValue(JsonConstraints)' (both are too strict)
  const arb = constraints != null ? jsonValue(constraints as any) : jsonValue();
  return arb.map(JSON.stringify);
}
export { json };
