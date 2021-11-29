import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { double, DoubleConstraints } from './double';
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
} & DoubleConstraints;

/** @internal */
function toTypedMapper(data: number[]): Float64Array {
  return Float64Array.from(data);
}

/** @internal */
function fromTypedUnmapper(value: unknown): number[] {
  if (!(value instanceof Float64Array)) throw new Error('Unexpected type');
  return [...value];
}

/**
 * For Float64Array
 * @remarks Since 2.9.0
 * @public
 */
export function float64Array(constraints: Float64ArrayConstraints = {}): Arbitrary<Float64Array> {
  return array(double(constraints), constraints).map(toTypedMapper, fromTypedUnmapper);
}
