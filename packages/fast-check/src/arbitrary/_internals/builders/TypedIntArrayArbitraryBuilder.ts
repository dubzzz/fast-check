import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { array } from '../../array';
import type { SizeForArbitrary } from '../helpers/MaxLengthFromMinLength';

/** @internal */
type TypedIntArrayBuilderConstraints<TValue> = {
  minLength?: number;
  maxLength?: number;
  min?: TValue;
  max?: TValue;
  size?: SizeForArbitrary;
};

/** @internal */
export function typedIntArrayArbitraryArbitraryBuilder<TTypedArrayType extends Iterable<TValue>, TValue>(
  constraints: TypedIntArrayBuilderConstraints<TValue>,
  defaultMin: TValue,
  defaultMax: TValue,
  TypedArrayClass: (new () => TTypedArrayType) & { from: (data: TValue[]) => TTypedArrayType },
  arbitraryBuilder: (constraints: { min?: TValue; max?: TValue }) => Arbitrary<TValue>,
): Arbitrary<TTypedArrayType> {
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
  return array(arbitraryBuilder({ min, max }), arrayConstraints).map(
    (data) => TypedArrayClass.from(data),
    (value: unknown): TValue[] => {
      if (!(value instanceof TypedArrayClass)) throw new Error('Invalid type');
      return [...(value as TTypedArrayType)];
    },
  );
}

/**
 * Constraints to be applied on typed arrays for integer values
 * @remarks Since 2.9.0
 * @public
 */
export type IntArrayConstraints = {
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
   * Lower bound for the generated int (included)
   * @defaultValue smallest possible value for this type
   * @remarks Since 2.9.0
   */
  min?: number;
  /**
   * Upper bound for the generated int (included)
   * @defaultValue highest possible value for this type
   * @remarks Since 2.9.0
   */
  max?: number;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: SizeForArbitrary;
};

/**
 * Constraints to be applied on typed arrays for big int values
 * @remarks Since 3.0.0
 * @public
 */
export type BigIntArrayConstraints = {
  /**
   * Lower bound of the generated array size
   * @defaultValue 0
   * @remarks Since 3.0.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated array size
   * @defaultValue 0x7fffffff — _defaulting seen as "max non specified" when `defaultSizeToMaxWhenMaxSpecified=true`_
   * @remarks Since 3.0.0
   */
  maxLength?: number;
  /**
   * Lower bound for the generated int (included)
   * @defaultValue smallest possible value for this type
   * @remarks Since 3.0.0
   */
  min?: bigint;
  /**
   * Upper bound for the generated int (included)
   * @defaultValue highest possible value for this type
   * @remarks Since 3.0.0
   */
  max?: bigint;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 3.0.0
   */
  size?: SizeForArbitrary;
};
