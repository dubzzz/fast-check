import { array } from './ArrayArbitrary';
import { bigInt } from './BigIntArbitrary';
import { Arbitrary } from './definition/Arbitrary';
import { DoubleNextConstraints } from './DoubleNextArbitrary';
import { double, float } from './FloatingPointArbitrary';
import { FloatNextConstraints } from './FloatNextArbitrary';
import { integer } from './IntegerArbitrary';

/** @internal */
type TypedIntArrayBuilderConstraints<TValue> = {
  minLength?: number;
  maxLength?: number;
  min?: TValue;
  max?: TValue;
};

/** @internal */
function typedIntArrayBuilder<TTypedArrayType, TValue>(
  constraints: TypedIntArrayBuilderConstraints<TValue>,
  defaultMin: TValue,
  defaultMax: TValue,
  TypedArrayClass: (new () => TTypedArrayType) & { from: (data: TValue[]) => TTypedArrayType },
  arbitraryBuilder: (constraints: { min?: TValue; max?: TValue }) => Arbitrary<TValue>
) {
  const generatorName = TypedArrayClass.name;
  const { min = defaultMin, max = defaultMax, ...arrayConstraints } = constraints;
  if (min > max) {
    throw new Error(`Invalid range passed to ${generatorName}: min must be lower than or equal to max`);
  }
  if (min < defaultMin) {
    throw new Error(`Invalid min value passed to ${generatorName}: min must be greater than or equal to ${defaultMin}`);
  }
  if (max > defaultMax) {
    throw new Error(`Invalid max value passed to ${generatorName}: max must be lower than or equal to ${defaultMax}`);
  }
  return array(arbitraryBuilder({ min, max }), arrayConstraints).map((data) => TypedArrayClass.from(data));
}

/**
 * Constraints to be applied on typed arrays for integer values
 * @public
 */
export type IntArrayConstraints = {
  /** Lower bound of the generated array size */
  minLength?: number;
  /** Upper bound of the generated array size */
  maxLength?: number;
  /**
   * Lower bound for the generated int (included)
   * @defaultValue smallest possible value for this type
   */
  min?: number;
  /**
   * Upper bound for the generated int (included)
   * @defaultValue highest possible value for this type
   */
  max?: number;
};

/**
 * For Int8Array
 * @public
 */
export function int8Array(constraints: IntArrayConstraints = {}): Arbitrary<Int8Array> {
  return typedIntArrayBuilder<Int8Array, number>(constraints, -127, 128, Int8Array, integer);
}

/**
 * For Uint8Array
 * @public
 */
export function uint8Array(constraints: IntArrayConstraints = {}): Arbitrary<Uint8Array> {
  return typedIntArrayBuilder<Uint8Array, number>(constraints, 0, 255, Uint8Array, integer);
}

/**
 * For Uint8ClampedArray
 * @public
 */
export function uint8ClampedArray(constraints: IntArrayConstraints = {}): Arbitrary<Uint8ClampedArray> {
  return typedIntArrayBuilder<Uint8ClampedArray, number>(constraints, 0, 255, Uint8ClampedArray, integer);
}

/**
 * For Int16Array
 * @public
 */
export function int16Array(constraints: IntArrayConstraints = {}): Arbitrary<Int16Array> {
  return typedIntArrayBuilder<Int16Array, number>(constraints, -32767, 32768, Int16Array, integer);
}

/**
 * For Uint16Array
 * @public
 */
export function uint16Array(constraints: IntArrayConstraints = {}): Arbitrary<Uint16Array> {
  return typedIntArrayBuilder<Uint16Array, number>(constraints, 0, 65535, Uint16Array, integer);
}

/**
 * For Int32Array
 * @public
 */
export function int32Array(constraints: IntArrayConstraints = {}): Arbitrary<Int32Array> {
  return typedIntArrayBuilder<Int32Array, number>(constraints, -0x80000000, 0x7fffffff, Int32Array, integer);
}

/**
 * For Uint32Array
 * @public
 */
export function uint32Array(constraints: IntArrayConstraints = {}): Arbitrary<Uint32Array> {
  return typedIntArrayBuilder<Uint32Array, number>(constraints, 0, 0xffffffff, Uint32Array, integer);
}

/**
 * Constraints to be applied on typed arrays for bigint values
 * @public
 */
export type BigIntArrayConstraints = {
  /** Lower bound of the generated array size */
  minLength?: number;
  /** Upper bound of the generated array size */
  maxLength?: number;
  /**
   * Lower bound for the generated int (included)
   * @defaultValue smallest possible value for this type
   */
  min?: bigint;
  /**
   * Upper bound for the generated int (included)
   * @defaultValue highest possible value for this type
   */
  max?: bigint;
};

/**
 * For BigInt64Array
 * @public
 */
export function bigInt64Array(constraints: BigIntArrayConstraints = {}): Arbitrary<BigInt64Array> {
  return typedIntArrayBuilder<BigInt64Array, bigint>(
    constraints,
    BigInt('-0x8000000000000000'),
    BigInt('0x7fffffffffffffff'),
    BigInt64Array,
    bigInt
  );
}

/**
 * For BigUint64Array
 * @public
 */
export function bigUint64Array(constraints: BigIntArrayConstraints = {}): Arbitrary<BigUint64Array> {
  return typedIntArrayBuilder<BigUint64Array, bigint>(
    constraints,
    BigInt(0),
    BigInt('0xffffffffffffffff'),
    BigUint64Array,
    bigInt
  );
}

/**
 * Constraints to be applied on {@link float32Array}
 * @public
 */
export type Float32ArrayConstraints = {
  /** Lower bound of the generated array size */
  minLength?: number;
  /** Upper bound of the generated array size */
  maxLength?: number;
} & FloatNextConstraints;

/**
 * For Float32Array
 * @public
 */
export function float32Array(constraints: Float32ArrayConstraints = {}): Arbitrary<Float32Array> {
  return array(float({ ...constraints, next: true }), constraints).map((data) => Float32Array.from(data));
}

/**
 * Constraints to be applied on {@link float64Array}
 * @public
 */
export type Float64ArrayConstraints = {
  /** Lower bound of the generated array size */
  minLength?: number;
  /** Upper bound of the generated array size */
  maxLength?: number;
} & DoubleNextConstraints;

/**
 * For Float64Array
 * @public
 */
export function float64Array(constraints: Float64ArrayConstraints = {}): Arbitrary<Float64Array> {
  return array(double({ ...constraints, next: true }), constraints).map((data) => Float64Array.from(data));
}
