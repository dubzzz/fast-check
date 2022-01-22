import { ArrayArbitrary } from './_internals/ArrayArbitrary';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
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
 * Extract constraints from args received by set
 * @internal
 */
function extractSetConstraints<T>(
  args:
    | []
    | [number]
    | [number, number]
    | [(a: T, b: T) => boolean]
    | [number, (a: T, b: T) => boolean]
    | [number, number, (a: T, b: T) => boolean]
    | [SetConstraints<T>]
): SetConstraints<T> {
  if (args[0] === undefined) {
    // set(arb)
    return {};
  } // args.length > 0

  if (args[1] === undefined) {
    const sargs = args as typeof args & [unknown]; // exactly 1 arg specified
    if (typeof sargs[0] === 'number') return { maxLength: sargs[0] }; // set(arb, maxLength)
    if (typeof sargs[0] === 'function') return { compare: sargs[0] }; // set(arb, compare)
    return sargs[0]; // set(arb, constraints)
  } // args.length > 1

  if (args[2] === undefined) {
    const sargs = args as typeof args & [unknown, unknown]; // exactly 2 args specified
    if (typeof sargs[1] === 'number') return { minLength: sargs[0], maxLength: sargs[1] }; // set(arb, minLength, maxLength)
    return { maxLength: sargs[0], compare: sargs[1] }; // set(arb, maxLength, compare)
  } // args.length > 2

  const sargs = args as typeof args & [unknown, unknown, unknown];
  return { minLength: sargs[0], maxLength: sargs[1], compare: sargs[2] }; // set(arb, minLength, maxLength, compare)
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
 *
 * @remarks Since 0.0.11
 * @public
 */
function set<T>(arb: Arbitrary<T>): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having an upper bound size
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param maxLength - Upper bound of the generated array size
 *
 * @deprecated
 * Superceded by `fc.set(arb, {maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function set<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having lower and upper bound size
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param minLength - Lower bound of the generated array size
 * @param maxLength - Upper bound of the generated array size
 *
 * @deprecated
 * Superceded by `fc.set(arb, {minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function set<T>(arb: Arbitrary<T>, minLength: number, maxLength: number): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` - unicity defined by `compare`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param compare - Return true when the two values are equals
 *
 * @deprecated
 * Superceded by `fc.set(arb, {compare})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function set<T>(arb: Arbitrary<T>, compare: (a: T, b: T) => boolean): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having an upper bound size - unicity defined by `compare`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param maxLength - Upper bound of the generated array size
 * @param compare - Return true when the two values are equals
 *
 * @deprecated
 * Superceded by `fc.array(arb, {maxLength, compare})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function set<T>(arb: Arbitrary<T>, maxLength: number, compare: (a: T, b: T) => boolean): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb` having lower and upper bound size - unicity defined by `compare`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param minLength - Lower bound of the generated array size
 * @param maxLength - Upper bound of the generated array size
 * @param compare - Return true when the two values are equals
 *
 * @deprecated
 * Superceded by `fc.array(arb, {minLength, maxLength, compare})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.11
 * @public
 */
function set<T>(
  arb: Arbitrary<T>,
  minLength: number,
  maxLength: number,
  compare: (a: T, b: T) => boolean
): Arbitrary<T[]>;
/**
 * For arrays of unique values coming from `arb`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function set<T>(arb: Arbitrary<T>, constraints: SetConstraints<T>): Arbitrary<T[]>;
function set<T>(
  arb: Arbitrary<T>,
  ...args:
    | []
    | [number]
    | [number, number]
    | [(a: T, b: T) => boolean]
    | [number, (a: T, b: T) => boolean]
    | [number, number, (a: T, b: T) => boolean]
    | [SetConstraints<T>]
): Arbitrary<T[]> {
  const constraints = buildCompleteSetConstraints(extractSetConstraints(args));

  const minLength = constraints.minLength;
  const maxLength = constraints.maxLength;
  const maxGeneratedLength = constraints.maxGeneratedLength;
  const setBuilder = constraints.setBuilder;

  const nextArb = convertToNext(arb);
  const arrayArb = convertFromNext(
    new ArrayArbitrary<T>(nextArb, minLength, maxGeneratedLength, maxLength, setBuilder)
  );
  if (minLength === 0) return arrayArb;
  return arrayArb.filter((tab) => tab.length >= minLength);
}
export { set };
