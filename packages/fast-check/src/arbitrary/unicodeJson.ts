import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { unicodeJsonValue } from './unicodeJsonValue';
import { JsonSharedConstraints } from './_internals/helpers/JsonConstraintsBuilder';

export { JsonSharedConstraints };

/**
 * For any JSON strings with unicode support
 *
 * Keys and string values rely on {@link unicode}
 *
 * @param constraints - Constraints to be applied onto the generated instance (since 2.5.0)
 *
 * @remarks Since 0.0.7
 * @public
 */
export function unicodeJson(constraints: JsonSharedConstraints = {}): Arbitrary<string> {
  const arb = unicodeJsonValue(constraints);
  return arb.map(JSON.stringify);
}
