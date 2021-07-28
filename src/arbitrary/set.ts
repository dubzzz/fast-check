import { ArrayArbitrary } from './_internals/ArrayArbitrary';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { maxLengthFromMinLength } from './_internals/helpers/MaxLengthFromMinLength';

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
   * Compare function - Return true when the two values are equals
   * @remarks Since 2.4.0
   */
  compare?: (a: T, b: T) => boolean;
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
  const {
    minLength = 0,
    maxLength = maxLengthFromMinLength(minLength),
    compare = (a: T, b: T) => a === b,
  } = constraints;

  const nextArb = convertToNext(arb);
  const arrayArb = convertFromNext(new ArrayArbitrary<T>(nextArb, minLength, maxLength, compare));
  if (minLength === 0) return arrayArb;
  return arrayArb.filter((tab) => tab.length >= minLength);
}
