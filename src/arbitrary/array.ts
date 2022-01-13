import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { ArrayArbitrary } from './_internals/ArrayArbitrary';
import { maxLengthFromMinLength } from './_internals/helpers/MaxLengthFromMinLength';

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
    const maxLength = maxLengthFromMinLength(0);
    return convertFromNext(new ArrayArbitrary<T>(nextArb, 0, maxLength, maxLength));
  }
  // fc.array(arb, constraints)
  if (typeof args[0] === 'object') {
    const minLength = args[0].minLength || 0;
    const specifiedMaxLength = args[0].maxLength;
    const maxLength = specifiedMaxLength !== undefined ? specifiedMaxLength : maxLengthFromMinLength(minLength);
    return convertFromNext(new ArrayArbitrary<T>(nextArb, minLength, maxLength, maxLength));
  }
  // fc.array(arb, minLength, maxLength)
  if (args[1] !== undefined) {
    const maxLength = args[1];
    return convertFromNext(new ArrayArbitrary<T>(nextArb, args[0], maxLength, maxLength));
  }
  // fc.array(arb, maxLength)
  const maxLength = args[0];
  return convertFromNext(new ArrayArbitrary<T>(nextArb, 0, maxLength, maxLength));
}
export { array };
