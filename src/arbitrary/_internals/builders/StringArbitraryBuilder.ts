import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { array } from '../../array';

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

/** @internal */
export type StringFullConstraintsDefinition = [] | [number] | [number, number] | [StringSharedConstraints];

/** @internal */
export function buildStringArbitrary(
  charArb: Arbitrary<string>,
  ...args: StringFullConstraintsDefinition
): Arbitrary<string> {
  const arrayArb =
    args[0] !== undefined
      ? typeof args[0] === 'number'
        ? typeof args[1] === 'number'
          ? array(charArb, { minLength: args[0], maxLength: args[1] })
          : array(charArb, { maxLength: args[0] })
        : array(charArb, args[0])
      : array(charArb);
  return arrayArb.map((tab) => tab.join(''));
}
