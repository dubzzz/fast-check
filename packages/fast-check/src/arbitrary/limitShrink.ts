import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { LimitedShrinkArbitrary } from './_internals/LimitedShrinkArbitrary';

export type LimitShrinkConstraints = {
  maxShrinks: number;
};

/**
 * Create another Arbitrary with limited number of shrink values
 *
 * @example
 * ```typescript
 * const dataGenerator: Arbitrary<string> = ...;
 * const limitedShrinkableDataGenerator: Arbitrary<string> = dataGenerator.limitShrink(2, 10);
 * // up to 2 in depth for the shrink and 10 per level
 * ```
 *
 * @returns Create another arbitrary with limited number of shrink values
 * @remarks Since x.x.x
 */
export function limitShrink<T>(arbitrary: Arbitrary<T>, constraints: LimitShrinkConstraints): Arbitrary<T> {
  return new LimitedShrinkArbitrary(arbitrary, constraints.maxShrinks);
}
