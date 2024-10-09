import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { IntegerArbitrary } from './_internals/IntegerArbitrary';

const safeNumberIsInteger = Number.isInteger;

/**
 * Constraints to be applied on {@link nat}
 * @remarks Since 2.6.0
 * @public
 */
export interface NatConstraints {
  /**
   * Upper bound for the generated postive integers (included)
   * @defaultValue 0x7fffffff
   * @remarks Since 2.6.0
   */
  max?: number;
}

/**
 * For positive integers between 0 (included) and 2147483647 (included)
 * @remarks Since 0.0.1
 * @public
 */
function nat(): Arbitrary<number>;
/**
 * For positive integers between 0 (included) and max (included)
 *
 * @param max - Upper bound for the generated integers
 *
 * @remarks You may prefer to use `fc.nat({max})` instead.
 * @remarks Since 0.0.1
 * @public
 */
function nat(max: number): Arbitrary<number>;
/**
 * For positive integers between 0 (included) and max (included)
 *
 * @param constraints - Constraints to apply when building instances
 * 
 * @example
 * ```typescript
 * fc.nat();
 * // Note: All possible integers between `0` (included) and `2147483647` (included)
 * // Examples of generated values: 2, 5, 2147483618, 225111650, 1108701149…
 * ```
 * 
 * @example
 * ```typescript
 * fc.nat(1000);
 * // Note: All possible integers between `0` (included) and `1000` (included)
 * // Examples of generated values: 2, 8, 4, 270, 0…
 * ```
 * 
 * @example
 * ```typescript
 * fc.nat({ max: 1000 });
 * // Note: All possible integers between `0` (included) and `1000` (included)
 * // Examples of generated values: 917, 60, 599, 696, 7…
 * ```
 *
 * @remarks Since 2.6.0
 * @public
 */
function nat(constraints: NatConstraints): Arbitrary<number>;
function nat(arg?: number | NatConstraints): Arbitrary<number> {
  const max = typeof arg === 'number' ? arg : arg && arg.max !== undefined ? arg.max : 0x7fffffff;
  if (max < 0) {
    throw new Error('fc.nat value should be greater than or equal to 0');
  }
  if (!safeNumberIsInteger(max)) {
    throw new Error('fc.nat maximum value should be an integer');
  }
  return new IntegerArbitrary(0, max);
}
export { nat };
