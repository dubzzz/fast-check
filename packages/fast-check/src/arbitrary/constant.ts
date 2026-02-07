import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { ConstantArbitrary } from './_internals/ConstantArbitrary.js';

/**
 * For `value`
 * @param value - The value to produce
 * @remarks Since 0.0.1
 * @public
 */
export function constant<const T>(value: T): Arbitrary<T> {
  return new ConstantArbitrary([value]);
}
