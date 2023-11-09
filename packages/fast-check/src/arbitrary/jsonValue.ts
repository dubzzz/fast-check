import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { string } from './string';
import type { JsonSharedConstraints, JsonValue } from './_internals/helpers/JsonConstraintsBuilder';
import { jsonConstraintsBuilder } from './_internals/helpers/JsonConstraintsBuilder';
import { anything } from './anything';

export type { JsonSharedConstraints, JsonValue };

/**
 * For any JSON compliant values
 *
 * Keys and string values rely on {@link string}
 *
 * As `JSON.parse` preserves `-0`, `jsonValue` can also have `-0` as a value.
 * `jsonValue` must be seen as: any value that could have been built by doing a `JSON.parse` on a given string.
 *
 * @param constraints - Constraints to be applied onto the generated instance
 *
 * @remarks Since 2.20.0
 * @public
 */
export function jsonValue(constraints: JsonSharedConstraints = {}): Arbitrary<JsonValue> {
  return anything(jsonConstraintsBuilder(string(), constraints)) as Arbitrary<JsonValue>;
}
