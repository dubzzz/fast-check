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
}
