import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { string } from './string';
import { jsonConstraintsBuilder, JsonSharedConstraints } from './_internals/helpers/JsonConstraintsBuilder';
import { anything } from './anything';

export { JsonSharedConstraints };

/**
 * For any JSON compliant values
 *
 * Keys and string values rely on {@link string}
 *
 * As `JSON.parse` preserves `-0`, `jsonObject` can also have `-0` as a value.
 * `jsonObject` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.
 *
 * @param constraints - Constraints to be applied onto the generated instance (since 2.5.0)
 *
 * @remarks Since 1.2.3
 * @public
 */
export function jsonObject(constraints: JsonSharedConstraints = {}): Arbitrary<unknown> {
  return anything(jsonConstraintsBuilder(string(), constraints));
}
