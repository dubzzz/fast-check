import { SizeForArbitrary } from '../_internals/helpers/MaxLengthFromMinLength';

/**
 * Constraints to be applied on arbitraries for strings
 * @remarks Since 2.4.0
 * @public
 */
export interface StringSharedConstraints {
  /**
   * Lower bound of the generated string length (included)
   * @remarks Since 2.4.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated string length (included)
   * @remarks Since 2.4.0
   */
  maxLength?: number;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: SizeForArbitrary;
}
