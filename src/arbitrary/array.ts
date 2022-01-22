import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { NextArbitrary } from '../check/arbitrary/definition/NextArbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { ArrayArbitrary } from './_internals/ArrayArbitrary';
import {
  MaxLengthUpperBound,
  SizeForArbitrary,
  maxGeneratedLengthFromSizeForArbitrary,
} from './_internals/helpers/MaxLengthFromMinLength';

/**
 * Constraints to be applied on {@link array}
 * @remarks Since 2.4.0
 * @public
 */
export interface ArrayConstraints {
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

/** @internal */
function createArrayArbitrary<T>(
  nextArb: NextArbitrary<T>,
  size: SizeForArbitrary | undefined,
  minLength: number,
  maxLengthOrUnset: number | undefined
): Arbitrary<T[]> {
  const maxLength = maxLengthOrUnset !== undefined ? maxLengthOrUnset : MaxLengthUpperBound;
  const specifiedMaxLength = maxLengthOrUnset !== undefined;
  const maxGeneratedLength = maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, specifiedMaxLength);
  return convertFromNext(new ArrayArbitrary<T>(nextArb, minLength, maxGeneratedLength, maxLength));
}

/**
 * For arrays of values coming from `arb`
 * @param arb - Arbitrary used to generate the values inside the array
 * @remarks Since 0.0.1
 * @public
 */
function array<T>(arb: Arbitrary<T>): Arbitrary<T[]>;
/**
 * For arrays of values coming from `arb` having an upper bound size
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param maxLength - Upper bound of the generated array size
 *
 * @deprecated
 * Superceded by `fc.array(arb, {maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.1
 * @public
 */
function array<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>;
/**
 * For arrays of values coming from `arb` having lower and upper bound size
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param minLength - Lower bound of the generated array size
 * @param maxLength - Upper bound of the generated array size
 *
 * @deprecated
 * Superceded by `fc.array(arb, {minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.7
 * @public
 */
function array<T>(arb: Arbitrary<T>, minLength: number, maxLength: number): Arbitrary<T[]>;
/**
 * For arrays of values coming from `arb` having lower and upper bound size
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function array<T>(arb: Arbitrary<T>, constraints: ArrayConstraints): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, ...args: [] | [number] | [number, number] | [ArrayConstraints]): Arbitrary<T[]> {
  const nextArb = convertToNext(arb);
  // fc.array(arb)
  if (args[0] === undefined) {
    return createArrayArbitrary(nextArb, undefined, 0, undefined); // no size, no maxLength
  }
  // fc.array(arb, constraints)
  if (typeof args[0] === 'object') {
    return createArrayArbitrary(nextArb, args[0].size, args[0].minLength || 0, args[0].maxLength);
  }
  // fc.array(arb, minLength, maxLength)
  if (args[1] !== undefined) {
    return createArrayArbitrary(nextArb, undefined, args[0], args[1]); // no size
  }
  // fc.array(arb, maxLength)
  return createArrayArbitrary(nextArb, undefined, 0, args[0]); // no size
}
export { array };
