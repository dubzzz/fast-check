import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { unicodeString } from './unicodeString';
import { jsonConstraintsBuilder, JsonSharedConstraints, JsonValue } from './_internals/helpers/JsonConstraintsBuilder';
import { anything } from './anything';

export { JsonSharedConstraints, JsonValue };

/**
 * For any JSON compliant values with unicode support
 *
 * Keys and string values rely on {@link unicode}
 *
 * As `JSON.parse` preserves `-0`, `unicodeJsonValue` can also have `-0` as a value.
 * `unicodeJsonValue` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.
 *
 * @param constraints - Constraints to be applied onto the generated instance
 *
 * @remarks Since 2.20.0
 * @public
 */
export function unicodeJsonValue(constraints: JsonSharedConstraints = {}): Arbitrary<JsonValue> {
  return anything(jsonConstraintsBuilder(unicodeString(), constraints)) as Arbitrary<JsonValue>;
}
