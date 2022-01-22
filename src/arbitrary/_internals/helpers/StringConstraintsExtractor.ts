import { SizeForArbitrary } from './MaxLengthFromMinLength';

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

/** @internal */
export type StringFullConstraintsDefinition = [] | [number] | [number, number] | [StringSharedConstraints];

/** @internal */
export function extractStringConstraints(options: StringFullConstraintsDefinition): StringSharedConstraints {
  return options[0] !== undefined
    ? typeof options[0] === 'number'
      ? typeof options[1] === 'number'
        ? { minLength: options[0], maxLength: options[1] }
        : { maxLength: options[0] }
      : options[0]
    : {};
}
