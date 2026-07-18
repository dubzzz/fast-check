import type { Random } from '../../../random/generator/Random.js';
import type { Stream } from '../../../stream/Stream.js';
import type { Value } from '../../arbitrary/definition/Value.js';
import type { PreconditionFailure } from '../../precondition/PreconditionFailure.js';
import type { PropertyFailure } from './PropertyFailure.js';

/**
 * Interface for a Property
 *
 * A property is the combination of:
 * - Arbitraries: how to generate the inputs for the algorithm
 * - Predicate: how to confirm the algorithm succeeded?
 *
 * @remarks Since 5.0.0
 * @public
 */
export interface Property<Ts> {
  /**
   * Generate values of type Ts
   *
   * @param mrng - Random number generator
   * @param runId - Id of the generation, starting at 0 - if set the generation might be biased
   *
   * @remarks Since 5.0.0
   */
  generate(mrng: Random, runId?: number): Value<Ts>;

  /**
   * Shrink value of type Ts
   *
   * @param value - The value to be shrunk, it can be context-less
   *
   * @remarks Since 5.0.0
   */
  shrink(value: Value<Ts>): Stream<Value<Ts>>;

  /**
   * Check the predicate for v
   * @param v - Value of which we want to check the predicate
   * @remarks Since 5.0.0
   */
  run(v: Ts): Promise<PreconditionFailure | PropertyFailure | null> | PreconditionFailure | PropertyFailure | null;

  /**
   * Run before each hook
   * @remarks Since 5.0.0
   */
  runBeforeEach: () => Promise<void> | void;

  /**
   * Run after each hook
   * @remarks Since 5.0.0
   */
  runAfterEach: () => Promise<void> | void;
}
