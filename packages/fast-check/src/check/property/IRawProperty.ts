import type { Random } from '../../random/generator/Random.js';
import type { Stream } from '../../stream/Stream.js';
import type { Value } from '../arbitrary/definition/Value.js';
import type { PreconditionFailure } from '../precondition/PreconditionFailure.js';

/**
 * Represent failures of the property
 * @remarks Since 3.0.0
 * @public
 */
export type PropertyFailure = {
  /**
   * The original error that has been intercepted.
   * Possibly not an instance Error as users can throw anything.
   * @remarks Since 3.0.0
   */
  error: unknown;
};

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
   * @remarks Since 0.0.7 (return type changed in 3.0.0)
   */
  generate(mrng: Random, runId?: number): Value<Ts>;

  /**
   * Shrink value of type Ts
   *
   * @param value - The value to be shrunk, it can be context-less
   *
   * @remarks Since 3.0.0
   */
  shrink(value: Value<Ts>): Stream<Value<Ts>>;

  /**
   * Check the predicate for v
   * @param v - Value of which we want to check the predicate
   * @remarks Since 0.0.7
   */
  run(
    v: Ts,
  ):
    | (IsAsync extends true ? Promise<PreconditionFailure | PropertyFailure | null> : never)
    | (IsAsync extends false ? PreconditionFailure | PropertyFailure | null : never);

  /**
   * Run before each hook
   * @remarks Since 3.4.0
   */
  runBeforeEach: () => (IsAsync extends true ? Promise<void> : never) | (IsAsync extends false ? void : never);

  /**
   * Run after each hook
   * @remarks Since 3.4.0
   */
  runAfterEach: () => (IsAsync extends true ? Promise<void> : never) | (IsAsync extends false ? void : never);
}

/**
 * Convert runId (IProperty) into a frequency (Arbitrary)
 *
 * Returns `2 + floor(log10(runId + 1))`. Implemented as a digit-count ladder
 * to stay on the Int32/SMI fast path and avoid the per-iteration
 * `DoubleToI` conversion that `~~(Math.log(...) * ...)` triggers in V8.
 *
 * @param runId - Id of the run starting at 0
 * @returns Frequency of bias starting at 2
 *
 * @internal
 */
export function runIdToFrequency(runId: number): number {
  // Compares against (10^k - 1) constants written so the bundler does not rewrite
  // them with scientific notation (e.g. 1000 → 1e3), which would force V8 onto a
  // Double comparison path and reintroduce per-iteration DoubleToI conversions.
  const n = runId + 1;
  if (n <= 9) return 2;
  if (n <= 99) return 3;
  if (n <= 999) return 4;
  if (n <= 9999) return 5;
  if (n <= 99999) return 6;
  if (n <= 999999) return 7;
  if (n <= 9999999) return 8;
  if (n <= 99999999) return 9;
  if (n <= 999999999) return 10;
  return 11;
}
