import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { unicodeJsonValue } from './unicodeJsonValue';
import type { UnicodeJsonSharedConstraints } from './_internals/helpers/JsonConstraintsBuilder';

export type { UnicodeJsonSharedConstraints };

/**
 * For any JSON strings with unicode support
 *
 * Keys and string values rely on {@link unicode}
 *
 * @param constraints - Constraints to be applied onto the generated instance (since 2.5.0)
 *
 * @deprecated Prefer using {@link json} with `stringUnit: "grapheme"`, it will generate even more unicode strings: includings some having characters outside of BMP plan
 * @remarks Since 0.0.7
 * @public
 */
export function unicodeJson(constraints: UnicodeJsonSharedConstraints = {}): Arbitrary<string> {
  const arb = unicodeJsonValue(constraints);
  return arb.map(JSON.stringify);
}
