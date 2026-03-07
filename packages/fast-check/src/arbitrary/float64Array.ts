import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import type { DoubleConstraints } from './double.js';
import { double } from './double.js';
import { array } from './array.js';
import type { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength.js';
import { Float64Array as SFloat64Array } from '../utils/globals.js';

/**
 * Constraints to be applied on {@link float64Array}
 * @remarks Since 2.9.0
 * @public
 */
export type Float64ArrayConstraints = {
  /**
   * Lower bound of the generated array size
   * @defaultValue 0
   * @remarks Since 2.9.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated array size
   * @defaultValue 0x7fffffff — _defaulting seen as "max non specified" when `defaultSizeToMaxWhenMaxSpecified=true`_
   * @remarks Since 2.9.0
   */
  maxLength?: number;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: SizeForArbitrary;
} & DoubleConstraints;

/** @internal */
function toTypedMapper(data: number[]): Float64Array<ArrayBuffer> {
  return SFloat64Array.from(data);
}

/** @internal */
function fromTypedUnmapper(value: unknown): number[] {
  if (!(value instanceof SFloat64Array)) throw new Error('Unexpected type');
  return [...value];
}

/**
 * For Float64Array
 * @remarks Since 2.9.0
 * @public
 */
export function float64Array(constraints: Float64ArrayConstraints = {}): Arbitrary<Float64Array<ArrayBuffer>> {
  return array(double(constraints), constraints).map(toTypedMapper, fromTypedUnmapper);
}
