import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { float, FloatConstraints } from '../check/arbitrary/FloatArbitrary';
import { array } from './array';

/**
 * Constraints to be applied on {@link float32Array}
 * @remarks Since 2.9.0
 * @public
 */
export type Float32ArrayConstraints = {
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
} & FloatConstraints;

/**
 * For Float32Array
 * @remarks Since 2.9.0
 * @public
 */
export function float32Array(constraints: Float32ArrayConstraints = {}): Arbitrary<Float32Array> {
  return array(float(constraints), constraints).map((data) => Float32Array.from(data));
}
