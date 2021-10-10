import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { NextValue } from '../arbitrary/definition/NextValue';
import { PreconditionFailure } from '../precondition/PreconditionFailure';

/**
 * Property
 *
 * A property is the combination of:
 * - Arbitraries: how to generate the inputs for the algorithm
 * - Predicate: how to confirm the algorithm succeeded?
 *
 * @remarks Since 2.19.0
 * @internal
 */
export interface INextRawProperty<Ts, IsAsync extends boolean = boolean> {
  /**
   * Is the property asynchronous?
   *
   * true in case of asynchronous property, false otherwise
   * @remarks Since 0.0.7
   */
  isAsync(): IsAsync;

  /**
   * Generate values of type Ts
   *
   * @param mrng - Random number generator
   * @param runId - Id of the generation, starting at 0 - if set the generation might be biased
   *
   * @remarks Since 0.0.7
   */
  generate(mrng: Random, runId?: number): NextValue<Ts>;

  /**
   * Shrink value of type Ts
   *
   * @param value - The value to be shrunk, it can be context-less
   *
   * @remarks Since 2.19.0
   */
  shrink(value: NextValue<Ts>): Stream<NextValue<Ts>>;

  /**
   * Check the predicate for v
   * @param v - Value of which we want to check the predicate
   * @remarks Since 0.0.7
   */
  run(
    v: Ts
  ):
    | (IsAsync extends true ? Promise<PreconditionFailure | string | null> : never)
    | (IsAsync extends false ? PreconditionFailure | string | null : never);
}
