import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { boolean } from '../../boolean';
import { constant } from '../../constant';
import { double } from '../../double';
import { maxSafeInteger } from '../../maxSafeInteger';
import { oneof } from '../../oneof';
import { string } from '../../string';
import { boxedArbitraryBuilder } from '../builders/BoxedArbitraryBuilder';
import { DepthFactorSizeForArbitrary, SizeForArbitrary } from './MaxLengthFromMinLength';

/**
 * Constraints for {@link anything} and {@link object}
 * @public
 */
export interface ObjectConstraints {
  /**
   * Limit the depth of the object by increasing the probability to generate simple values (defined via values)
   * as we go deeper in the object.
   *
   * @remarks Since 2.20.0
   */
  depthFactor?: DepthFactorSizeForArbitrary;
  /**
   * Maximal depth allowed
   * @remarks Since 0.0.7
   */
  maxDepth?: number;
  /**
   * Maximal number of keys
   * @remarks Since 1.13.0
   */
  maxKeys?: number;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: SizeForArbitrary;
  /**
   * Arbitrary for keys
   *
   * Default for `key` is: {@link string}
   * @remarks Since 0.0.7
   */
  key?: Arbitrary<string>;
  /**
   * Arbitrary for values
   *
   * Default for `values` are:
   * - {@link boolean},
   * - {@link integer},
   * - {@link double},
   * - {@link string}
   * - constants among:
   *  - `null`,
   *  - `undefined`,
   *  - `Number.NaN`,
   *  - `+0`,
   *  - `-0`,
   *  - `Number.EPSILON`,
   *  - `Number.MIN_VALUE`,
   *  - `Number.MAX_VALUE`,
   *  - `Number.MIN_SAFE_INTEGER`,
   *  - `Number.MAX_SAFE_INTEGER`,
   *  - `Number.POSITIVE_INFINITY`,
   *  - `Number.NEGATIVE_INFINITY`
   * @remarks Since 0.0.7
   */
  values?: Arbitrary<unknown>[];
  /**
   * Also generate boxed versions of values
   * @remarks Since 1.11.0
   */
  withBoxedValues?: boolean;
  /**
   * Also generate Set
   * @remarks Since 1.11.0
   */
  withSet?: boolean;
  /**
   * Also generate Map
   * @remarks Since 1.11.0
   */
  withMap?: boolean;
  /**
   * Also generate string representations of object instances
   * @remarks Since 1.17.0
   */
  withObjectString?: boolean;
  /**
   * Also generate object with null prototype
   * @remarks Since 1.23.0
   */
  withNullPrototype?: boolean;
  /**
   * Also generate BigInt
   * @remarks Since 1.26.0
   */
  withBigInt?: boolean;
  /**
   * Also generate Date
   * @remarks Since 2.5.0
   */
  withDate?: boolean;
  /**
   * Also generate typed arrays in: (Uint|Int)(8|16|32)Array and Float(32|64)Array
   * Remark: no typed arrays made of bigint
   * @remarks Since 2.9.0
   */
  withTypedArray?: boolean;
  /**
   * Also generate sparse arrays (arrays with holes)
   * @remarks Since 2.13.0
   */
  withSparseArray?: boolean;
}

/**
 * Internal wrapper around an `ObjectConstraints`, it adds all the missing pieces in the configuration
 * @internal
 */
export type QualifiedObjectConstraints = Required<Omit<ObjectConstraints, 'withBoxedValues' | 'depthFactor' | 'size'>> &
  Pick<ObjectConstraints, 'depthFactor' | 'size'>;

/** @internal */
function defaultValues(constraints: { size: SizeForArbitrary }): Arbitrary<unknown>[] {
  return [
    boolean(),
    maxSafeInteger(),
    double({ next: true }),
    string(constraints),
    oneof(string(constraints), constant(null), constant(undefined)),
  ];
}

/** @internal */
function boxArbitraries(arbs: Arbitrary<unknown>[]): Arbitrary<unknown>[] {
  return arbs.map((arb) => boxedArbitraryBuilder(arb));
}

/** @internal */
function boxArbitrariesIfNeeded(arbs: Arbitrary<unknown>[], boxEnabled: boolean): Arbitrary<unknown>[] {
  return boxEnabled ? boxArbitraries(arbs).concat(arbs) : arbs;
}

/**
 * Convert constraints of type ObjectConstraints into fully qualified constraints
 * @internal
 */
export function toQualifiedObjectConstraints(settings: ObjectConstraints = {}): QualifiedObjectConstraints {
  function orDefault<T>(optionalValue: T | undefined, defaultValue: T): T {
    return optionalValue !== undefined ? optionalValue : defaultValue;
  }
  const valueConstraints = { size: settings.size };
  return {
    key: orDefault(settings.key, string(valueConstraints)),
    values: boxArbitrariesIfNeeded(
      orDefault(settings.values, defaultValues(valueConstraints)),
      orDefault(settings.withBoxedValues, false)
    ),
    depthFactor: settings.depthFactor,
    maxDepth: orDefault(settings.maxDepth, 2),
    maxKeys: orDefault(settings.maxKeys, 5),
    size: settings.size,
    withSet: orDefault(settings.withSet, false),
    withMap: orDefault(settings.withMap, false),
    withObjectString: orDefault(settings.withObjectString, false),
    withNullPrototype: orDefault(settings.withNullPrototype, false),
    withBigInt: orDefault(settings.withBigInt, false),
    withDate: orDefault(settings.withDate, false),
    withTypedArray: orDefault(settings.withTypedArray, false),
    withSparseArray: orDefault(settings.withSparseArray, false),
  };
}
