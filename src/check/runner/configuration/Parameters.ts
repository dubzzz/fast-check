/**
 * Customization of the parameters used to run the properties
 */
export interface Parameters {
  /**
   * Initial seed of the generator: `Date.now()` by default
   *
   * It can be forced to replay a failed run
   */
  seed?: number;
  /**
   * Number of runs before success: 100 by default
   */
  numRuns?: number;
  /**
   * Maximum time in milliseconds for the predicate to answer: disabled by default
   *
   * WARNING: Only works for async code (see {@link asyncProperty}), will not interrupt a synchronous code.
   */
  timeout?: number;
  /**
   * Way to replay a failing property directly with the counterexample.
   * It can be fed with the counterexamplePath returned by the failing test (requires `seed` too).
   */
  path?: string;
  /**
   * Logger (see {@link statistics}): `console.log` by default
   */
  logger?(v: string): void;
  /**
   * Force the use of unbiased arbitraries: biased by default
   */
  unbiased?: boolean;
  /**
   * Enable verbose mode: false by default
   *
   * When enabling verbose mode
   * you will be provided the list of all failing entries encountered whenever a property fails
   *
   * It can prove very useful to detect pattern in the inputs causing the problem to occur
   */
  verbose?: boolean;
}
