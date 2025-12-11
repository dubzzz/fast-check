import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { string } from './string.js';
import type { JsonSharedConstraints, JsonValue } from './_internals/helpers/JsonConstraintsBuilder.js';
import { jsonConstraintsBuilder } from './_internals/helpers/JsonConstraintsBuilder.js';
import { anything } from './anything.js';

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
  const noUnicodeString = constraints.noUnicodeString === undefined || constraints.noUnicodeString === true;
  const stringArbitrary =
    'stringUnit' in constraints
      ? string({ unit: constraints.stringUnit })
      : noUnicodeString
        ? string()
        : string({ unit: 'binary' });
  return anything(jsonConstraintsBuilder(stringArbitrary, constraints)) as Arbitrary<JsonValue>;
}
