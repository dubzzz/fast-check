import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { LimitedShrinkArbitrary } from './_internals/LimitedShrinkArbitrary';

/**
 * Constraints to be applied on {@link limitShrink}
 * @remarks Since 3.20.0
 * @public
 */
export type LimitShrinkConstraints = {
  /**
   * Define the maximal number of shrink values that can be pulled from this arbitrary
   * @remarks Since 3.20.0
   */
  maxShrinks: number;
};

/**
 * Create another Arbitrary with a limited (or capped) number of shrink values
 *
 * @example
 * ```typescript
 * const dataGenerator: Arbitrary<string> = ...;
 * const limitedShrinkableDataGenerator: Arbitrary<string> = fc.limitShrink(dataGenerator, { maxShrinks: 10 });
 * // up to 10 shrunk values could be extracted from the resulting arbitrary
 * ```
 *
 * NOTE: While limiting shrinking capabilities might be appealing to make your CI faster in case of failures,
 * we don't recommend to use it for that purpose. If you care about shrinking time of your automated jobs or
 * local executions, you should rather look for `endOnFailure` or `interruptAfterTimeLimit`.
 *
 * @returns Create another arbitrary with limited number of shrink values
 * @remarks Since 3.20.0
 */
export function limitShrink<T>(arbitrary: Arbitrary<T>, constraints: LimitShrinkConstraints): Arbitrary<T> {
  return new LimitedShrinkArbitrary(arbitrary, constraints.maxShrinks);
}
