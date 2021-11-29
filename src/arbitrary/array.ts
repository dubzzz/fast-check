import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
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
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
function array<T>(arb: Arbitrary<T>, constraints: ArrayConstraints = {}): Arbitrary<T[]> {
  const nextArb = arb;
  const minLength = constraints.minLength || 0;
  const specifiedMaxLength = constraints.maxLength;
  const maxLength = specifiedMaxLength !== undefined ? specifiedMaxLength : maxLengthFromMinLength(minLength);
  return new ArrayArbitrary<T>(nextArb, minLength, maxLength);
}
export { array };
