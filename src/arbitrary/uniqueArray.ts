import { ArrayArbitrary } from './_internals/ArrayArbitrary';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import {
  maxGeneratedLengthFromSizeForArbitrary,
  MaxLengthUpperBound,
  SizeForArbitrary,
} from './_internals/helpers/MaxLengthFromMinLength';
import { CustomSetBuilder } from './_internals/interfaces/CustomSet';
import { CustomEqualSet } from './_internals/helpers/CustomEqualSet';
import { NextValue } from '../check/arbitrary/definition/NextValue';
import { StrictlyEqualSet } from './_internals/helpers/StrictlyEqualSet';
import { SameValueSet } from './_internals/helpers/SameValueSet';
import { SameValueZeroSet } from './_internals/helpers/SameValueZeroSet';

/** @internal */
function buildUniqueArraySetBuilder<T, U>(constraints: UniqueArrayConstraints<T, U>): CustomSetBuilder<NextValue<T>> {
  // Remark: Whenever we don't pass any custom selector U=T
  // so v of type T is simply a U
  if (typeof constraints.comparator === 'function') {
    if (constraints.selector === undefined) {
      const comparator = constraints.comparator;
      const isEqualForBuilder = (nextA: NextValue<T>, nextB: NextValue<T>) => comparator(nextA.value_, nextB.value_);
      return () => new CustomEqualSet(isEqualForBuilder);
    }
    const comparator = constraints.comparator;
    const selector = constraints.selector;
    const refinedSelector = (next: NextValue<T>) => selector(next.value_);
    const isEqualForBuilder = (nextA: NextValue<T>, nextB: NextValue<T>) =>
      comparator(refinedSelector(nextA), refinedSelector(nextB));
    return () => new CustomEqualSet(isEqualForBuilder);
  }
  const selector = constraints.selector || ((v) => v);
  const refinedSelector = (next: NextValue<T>) => selector(next.value_);
  switch (constraints.comparator) {
    case 'SameValue':
      return () => new SameValueSet(refinedSelector);
    case 'SameValueZero':
      return () => new SameValueZeroSet(refinedSelector);
    case 'IsStrictlyEqual':
    case undefined:
      return () => new StrictlyEqualSet(refinedSelector);
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
   * @remarks Since 2.23.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated array size
   * @remarks Since 2.23.0
   */
  maxLength?: number;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.23.0
   */
  size?: SizeForArbitrary;
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
   * - IsStrictlyEqual behaves like `===` — {@link https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isstrictlyequal}
   * - SameValue behaves like `Object.is` — {@link https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevalue}
   * - SameValueZero behaves like `Set` or `Map` — {@link https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero}
   * - Fully custom comparison function: it implies performance costs for large arrays
   *
   * @defaultValue 'IsStrictlyEqual'
   * @remarks Since 2.23.0
   */
  comparator?: 'IsStrictlyEqual' | 'SameValue' | 'SameValueZero';
  /**
   * How we should project the values before comparing them together
   * @defaultValue (v => v)
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
  const setBuilder = buildUniqueArraySetBuilder(constraints);

  const nextArb = convertToNext(arb);
  const arrayArb = convertFromNext(
    new ArrayArbitrary<T>(nextArb, minLength, maxGeneratedLength, maxLength, setBuilder)
  );
  if (minLength === 0) return arrayArb;
  return arrayArb.filter((tab) => tab.length >= minLength);
}
