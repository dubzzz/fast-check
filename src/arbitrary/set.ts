import { ArrayArbitrary } from './_internals/ArrayArbitrary';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import {
  MaxLengthUpperBound,
  SizeForArbitrary,
  maxGeneratedLengthFromSizeForArbitrary,
} from './_internals/helpers/MaxLengthFromMinLength';
import { CustomSetBuilder } from './_internals/interfaces/CustomSet';
import { CustomEqualSet } from './_internals/helpers/CustomEqualSet';
import { NextValue } from '../check/arbitrary/definition/NextValue';
import { StrictlyEqualSet } from './_internals/helpers/StrictlyEqualSet';
import { SameValueSet } from './_internals/helpers/SameValueSet';
import { SameValueZeroSet } from './_internals/helpers/SameValueZeroSet';

/** @internal */
function buildSetBuilder<T>(constraints: SetConstraints<T>): CustomSetBuilder<NextValue<T>> {
  const compare: NonNullable<typeof constraints.compare> = constraints.compare || {};
  if (typeof compare === 'function') {
    const isEqualForBuilder = (nextA: NextValue<T>, nextB: NextValue<T>) => compare(nextA.value_, nextB.value_);
    return () => new CustomEqualSet(isEqualForBuilder);
  }
  const selector = compare.selector || ((v) => v);
  const refinedSelector = (next: NextValue<T>) => selector(next.value_);
  switch (compare.type) {
    case 'SameValue':
      return () => new SameValueSet(refinedSelector);
    case 'SameValueZero':
      return () => new SameValueZeroSet(refinedSelector);
    case 'IsStrictlyEqual':
    case undefined:
      return () => new StrictlyEqualSet(refinedSelector);
  }
}

/** @internal */
type CompleteSetConstraints<T> = Required<Omit<SetConstraints<T>, 'compare' | 'size'>> & {
  setBuilder: CustomSetBuilder<NextValue<T>>;
  maxGeneratedLength: number;
};

/**
 * Build fully set SetConstraints from a partial data
 * @internal
 */
function buildCompleteSetConstraints<T>(constraints: SetConstraints<T>): CompleteSetConstraints<T> {
  const minLength = constraints.minLength !== undefined ? constraints.minLength : 0;
  const maxLength = constraints.maxLength !== undefined ? constraints.maxLength : MaxLengthUpperBound;
  const maxGeneratedLength = maxGeneratedLengthFromSizeForArbitrary(
    constraints.size,
    minLength,
    maxLength,
    constraints.maxLength !== undefined
  );
  const setBuilder = buildSetBuilder(constraints);
  return { minLength, maxGeneratedLength, maxLength, setBuilder };
}

/**
 * Type used to define a constraints to compare values together based on a selector approach
 * @remarks Since 2.21.0
 * @public
 */
export type SetConstraintsSelector<T> = {
  /**
   * The operator to be used to compare the values:
   * - IsStrictlyEqual behaves like `===` — {@link https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isstrictlyequal}
   * - SameValue behaves like `Object.is` — {@link https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevalue}
   * - SameValueZero behaves like `Set` or `Map` — {@link https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero}
   * @remarks Since 2.21.0
   */
  type?: 'IsStrictlyEqual' | 'SameValue' | 'SameValueZero';
  /**
   * How we should project the values before comparing them together
   * @remarks Since 2.21.0
   */
  selector?: (v: T) => unknown;
};

/**
 * Constraints to be applied on {@link set}
 * @remarks Since 2.4.0
 * @public
 */
export interface SetConstraints<T> {
  /**
   * Lower bound of the generated array size
   * @remarks Since 2.4.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated array size
   * @remarks Since 2.4.0
   */
  maxLength?: number;
  /**
   * Compare operator - It can either be:
   * - a selector based definition consisting into projecting the value (if needed) onto a relevant
   *   value (see selector) and comparing all those values together based on a selected comparison
   *   operator (see type)
   * - a compare function returning true whenever the two values are equal (not recommended for
   *   large arrays as this approach is more costly in terms of computation and does not scale)
   *
   * It defaults to:
   * - type = "IsStrictlyEqual"
   * - selector = v =&gt; v
   * Which is equivalent (except performances) to: compare = (a, b) =&gt; a === b
   *
   * @remarks Since 2.4.0
   */
  compare?: ((a: T, b: T) => boolean) | SetConstraintsSelector<T>;
  /**
   * Define how large the generated values should be (at max)
   *
   * When used in conjonction with `maxLength`, `size` will be used to define
   * the upper bound of the generated array size while `maxLength` will be used
   * to define and document the general maximal length allowed for this case.
   *
   * @remarks Since 2.22.0
   */
  size?: SizeForArbitrary;
}

/**
 * For arrays of unique values coming from `arb`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.11
 * @public
 */
export function set<T>(arb: Arbitrary<T>, constraints: SetConstraints<T> = {}): Arbitrary<T[]> {
  const { minLength, maxGeneratedLength, maxLength, setBuilder } = buildCompleteSetConstraints(constraints);
  const arrayArb = new ArrayArbitrary<T>(arb, minLength, maxGeneratedLength, maxLength, setBuilder);
  if (minLength === 0) return arrayArb;
  return arrayArb.filter((tab) => tab.length >= minLength);
}
