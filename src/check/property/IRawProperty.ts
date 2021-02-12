import { Random } from '../../random/generator/Random';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { PreconditionFailure } from '../precondition/PreconditionFailure';

/**
 * Property
 *
 * A property is the combination of:
 * - Arbitraries: how to generate the inputs for the algorithm
 * - Predicate: how to confirm the algorithm succeeded?
 *
 * @remarks Since 1.19.0
 * @public
 */
export interface IRawProperty<Ts, IsAsync extends boolean = boolean> {
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
  generate(mrng: Random, runId?: number): Shrinkable<Ts>;
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

/**
 * Convert runId (IProperty) into a frequency (Arbitrary)
 *
 * @param runId - Id of the run starting at 0
 * @returns Frequency of bias starting at 2
 *
 * @internal
 */
export const runIdToFrequency = (runId: number): number => 2 + Math.floor(Math.log(runId + 1) / Math.log(10));
