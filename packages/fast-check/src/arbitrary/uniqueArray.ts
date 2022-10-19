import { ArrayArbitrary } from './_internals/ArrayArbitrary';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import {
  maxGeneratedLengthFromSizeForArbitrary,
  MaxLengthUpperBound,
  SizeForArbitrary,
} from './_internals/helpers/MaxLengthFromMinLength';
import { CustomSetBuilder } from './_internals/interfaces/CustomSet';
import { CustomEqualSet } from './_internals/helpers/CustomEqualSet';
import { Value } from '../check/arbitrary/definition/Value';
import { StrictlyEqualSet } from './_internals/helpers/StrictlyEqualSet';
import { SameValueSet } from './_internals/helpers/SameValueSet';
import { SameValueZeroSet } from './_internals/helpers/SameValueZeroSet';
import { DepthIdentifier } from './_internals/helpers/DepthContext';

/** @internal */
function buildUniqueArraySetBuilder<T, U>(constraints: UniqueArrayConstraints<T, U>): CustomSetBuilder<Value<T>> {
  // Remark: Whenever we don't pass any custom selector U=T
  // so v of type T is simply a U
  if (typeof constraints.comparator === 'function') {
    if (constraints.selector === undefined) {
      const comparator = constraints.comparator;
      const isEqualForBuilder = (nextA: Value<T>, nextB: Value<T>) => comparator(nextA.value_, nextB.value_);
      return () => new CustomEqualSet(isEqualForBuilder);
    }
    const comparator = constraints.comparator;
    const selector = constraints.selector;
    const refinedSelector = (next: Value<T>) => selector(next.value_);
    const isEqualForBuilder = (nextA: Value<T>, nextB: Value<T>) =>
      comparator(refinedSelector(nextA), refinedSelector(nextB));
    return () => new CustomEqualSet(isEqualForBuilder);
  }
  const selector = constraints.selector || ((v) => v);
  const refinedSelector = (next: Value<T>) => selector(next.value_);
  switch (constraints.comparator) {
    case 'IsStrictlyEqual':
      return () => new StrictlyEqualSet(refinedSelector);
    case 'SameValueZero':
      return () => new SameValueZeroSet(refinedSelector);
    case 'SameValue':
    case undefined:
      return () => new SameValueSet(refinedSelector);
  }
}

/**
 * Shared constraints to be applied on {@link uniqueArray}
 * @remarks Since 2.23.0
 * @public
 */
export type UniqueArraySharedConstraints = {
  /**
   * Lower bound of the generated array size
   * @defaultValue 0
   * @remarks Since 2.23.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated array size
   * @defaultValue 0x7fffffff — _defaulting seen as "max non specified" when `defaultSizeToMaxWhenMaxSpecified=true`_
   * @remarks Since 2.23.0
   */
  maxLength?: number;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.23.0
   */
  size?: SizeForArbitrary;
  /**
   * When receiving a depth identifier, the arbitrary will impact the depth
   * attached to it to avoid going too deep if it already generated lots of items.
   *
   * In other words, if the number of generated values within the collection is large
   * then the generated items will tend to be less deep to avoid creating structures a lot
   * larger than expected.
   *
   * For the moment, the depth is not taken into account to compute the number of items to
   * define for a precise generate call of the array. Just applied onto eligible items.
   *
   * @remarks Since 2.25.0
   */
  depthIdentifier?: DepthIdentifier | string;
};

/**
 * Constraints implying known and optimized comparison function
 * to be applied on {@link uniqueArray}
 *
 * @remarks Since 2.23.0
 * @public
 */
export type UniqueArrayConstraintsRecommended<T, U> = UniqueArraySharedConstraints & {
  /**
   * The operator to be used to compare the values after having applied the selector (if any):
   * - SameValue behaves like `Object.is` — {@link https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevalue}
   * - SameValueZero behaves like `Set` or `Map` — {@link https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero}
   * - IsStrictlyEqual behaves like `===` — {@link https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isstrictlyequal}
   * - Fully custom comparison function: it implies performance costs for large arrays
   *
   * @defaultValue 'SameValue'
   * @remarks Since 2.23.0
   */
  comparator?: 'SameValue' | 'SameValueZero' | 'IsStrictlyEqual';
  /**
   * How we should project the values before comparing them together
   * @defaultValue (v =&gt; v)
   * @remarks Since 2.23.0
   */
  selector?: (v: T) => U;
};

/**
 * Constraints implying a fully custom comparison function
 * to be applied on {@link uniqueArray}
 *
 * WARNING - Imply an extra performance cost whenever you want to generate large arrays
 *
 * @remarks Since 2.23.0
 * @public
 */
export type UniqueArrayConstraintsCustomCompare<T> = UniqueArraySharedConstraints & {
  /**
   * The operator to be used to compare the values after having applied the selector (if any)
   * @remarks Since 2.23.0
   */
  comparator: (a: T, b: T) => boolean;
  /**
   * How we should project the values before comparing them together
   * @remarks Since 2.23.0
   */
  selector?: undefined;
};

/**
 * Constraints implying fully custom comparison function and selector
 * to be applied on {@link uniqueArray}
 *
 * WARNING - Imply an extra performance cost whenever you want to generate large arrays
 *
 * @remarks Since 2.23.0
 * @public
 */
export type UniqueArrayConstraintsCustomCompareSelect<T, U> = UniqueArraySharedConstraints & {
  /**
   * The operator to be used to compare the values after having applied the selector (if any)
   * @remarks Since 2.23.0
   */
  comparator: (a: U, b: U) => boolean;
  /**
   * How we should project the values before comparing them together
   * @remarks Since 2.23.0
   */
  selector: (v: T) => U;
};

/**
 * Constraints implying known and optimized comparison function
 * to be applied on {@link uniqueArray}
 *
 * The defaults relies on the defaults specified by {@link UniqueArrayConstraintsRecommended}
 *
 * @remarks Since 2.23.0
 * @public
 */
export type UniqueArrayConstraints<T, U> =
  | UniqueArrayConstraintsRecommended<T, U>
  | UniqueArrayConstraintsCustomCompare<T>
  | UniqueArrayConstraintsCustomCompareSelect<T, U>;

/**
 * For arrays of unique values coming from `arb`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.23.0
 * @public
 */
export function uniqueArray<T, U>(
  arb: Arbitrary<T>,
  constraints?: UniqueArrayConstraintsRecommended<T, U>
): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.23.0
 * @public
 */
export function uniqueArray<T>(arb: Arbitrary<T>, constraints: UniqueArrayConstraintsCustomCompare<T>): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.23.0
 * @public
 */
export function uniqueArray<T, U>(
  arb: Arbitrary<T>,
  constraints: UniqueArrayConstraintsCustomCompareSelect<T, U>
): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.23.0
 * @public
 */
export function uniqueArray<T, U>(arb: Arbitrary<T>, constraints: UniqueArrayConstraints<T, U>): Arbitrary<T[]>;
export function uniqueArray<T, U>(arb: Arbitrary<T>, constraints: UniqueArrayConstraints<T, U> = {}): Arbitrary<T[]> {
  const minLength = constraints.minLength !== undefined ? constraints.minLength : 0;
  const maxLength = constraints.maxLength !== undefined ? constraints.maxLength : MaxLengthUpperBound;
  const maxGeneratedLength = maxGeneratedLengthFromSizeForArbitrary(
    constraints.size,
    minLength,
    maxLength,
    constraints.maxLength !== undefined
  );
  const depthIdentifier = constraints.depthIdentifier;
  const setBuilder = buildUniqueArraySetBuilder(constraints);

  const arrayArb = new ArrayArbitrary<T>(
    arb,
    minLength,
    maxGeneratedLength,
    maxLength,
    depthIdentifier,
    setBuilder,
    []
  );
  if (minLength === 0) return arrayArb;
  return arrayArb.filter((tab) => tab.length >= minLength);
}
