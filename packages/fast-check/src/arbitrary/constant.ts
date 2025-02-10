import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { ConstantArbitrary } from './_internals/ConstantArbitrary';

/**
 * For `value`
 * @param value - The value to produce
 * @remarks Since 0.0.1
 * @public
 */
export function constant<const T>(value: T): Arbitrary<T> {
  return new ConstantArbitrary([value]);
}
