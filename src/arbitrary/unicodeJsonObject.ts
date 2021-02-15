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
 * As `JSON.parse` preserves `-0`, `unicodeJsonObject` can also have `-0` as a value.
 * `unicodeJsonObject` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.
 *
 * @param constraints - Constraints to be applied onto the generated instance (since 2.5.0)
 *
 * @remarks Since 1.2.3
 * @public
 */
export function unicodeJsonObject(constraints: JsonSharedConstraints = {}): Arbitrary<unknown> {
  return anything(jsonConstraintsBuilder(unicodeString(), constraints));
}
