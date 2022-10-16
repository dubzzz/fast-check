import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { float, FloatConstraints } from './float';
import { array } from './array';
import { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';
import { Float32Array } from '../utils/globals';

/**
 * Constraints to be applied on {@link float32Array}
 * @remarks Since 2.9.0
 * @public
 */
export type Float32ArrayConstraints = {
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
} & FloatConstraints;

/** @internal */
function toTypedMapper(data: number[]): Float32Array {
  return Float32Array.from(data);
}

/** @internal */
function fromTypedUnmapper(value: unknown): number[] {
  if (!(value instanceof Float32Array)) throw new Error('Unexpected type');
  return [...value];
}

/**
 * For Float32Array
 * @remarks Since 2.9.0
 * @public
 */
export function float32Array(constraints: Float32ArrayConstraints = {}): Arbitrary<Float32Array> {
  return array(float(constraints), constraints).map(toTypedMapper, fromTypedUnmapper);
}
