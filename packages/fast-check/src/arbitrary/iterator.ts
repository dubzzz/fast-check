import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { IteratorArbitrary } from './_internals/IteratorArbitrary.js';

/**
 * Constraints to be applied on {@link iterator}
 * @remarks Since 4.3.0
 * @public
 */
interface IteratorConstraints {
  /**
   * Do not save items emitted by this arbitrary and print count instead.
   * Recommended for very large tests.
   *
   * @defaultValue false
   */
  noHistory?: boolean;
}

/**
 * Produce an infinite iterator of values
 *
 * WARNING: By default, iterator remembers all values it has ever
 * generated. This causes unbounded memory growth during large tests.
 * Set noHistory to disable.
 *
 * WARNING: Requires Object.assign
 *
 * @param arb - Arbitrary used to generate the values
 * @param constraints - Constraints to apply when building instances (since 4.3.0)
 *
 * @remarks Since 1.8.0
 * @public
 */
function iterator<T>(arb: Arbitrary<T>, constraints?: IteratorConstraints): Arbitrary<IteratorObject<T, never>> {
  const history =
    constraints !== undefined && typeof constraints === 'object' && 'noHistory' in constraints
      ? !constraints.noHistory
      : true;
  return new IteratorArbitrary(arb, history);
}

export { iterator };
