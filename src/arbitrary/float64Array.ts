import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { DoubleNextConstraints } from './_next/doubleNext';
import { double } from './double';
import { array } from './array';

/**
 * Constraints to be applied on {@link float64Array}
 * @remarks Since 2.9.0
 * @public
 */
export type Float64ArrayConstraints = {
  /**
   * Lower bound of the generated array size
   * @remarks Since 2.9.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated array size
   * @remarks Since 2.9.0
   */
  maxLength?: number;
} & DoubleNextConstraints;

/**
 * For Float64Array
 * @remarks Since 2.9.0
 * @public
 */
export function float64Array(constraints: Float64ArrayConstraints = {}): Arbitrary<Float64Array> {
  return array(double({ ...constraints, next: true }), constraints).map((data) => Float64Array.from(data));
}
