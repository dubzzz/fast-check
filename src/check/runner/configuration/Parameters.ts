import { RandomGenerator } from 'pure-rand';
import { RandomType } from './RandomType';
import { VerbosityLevel } from './VerbosityLevel';

/**
 * Customization of the parameters used to run the properties
 */
export interface Parameters<T = void> {
  /**
   * Initial seed of the generator: `Date.now()` by default
   *
   * It can be forced to replay a failed run.
   *
   * In theory, seeds are supposed to be 32 bits integers.
   * In case of double value, the seed will be rescaled into a valid 32 bits integer (eg.: values between 0 and 1 will be evenly spread into the range of possible seeds).
   */
  seed?: number;
  /**
   * Random number generator: `xorshift128plus` by default
   *
   * Random generator is the core element behind the generation of random values - changing it might directly impact the quality and performances of the generation of random values.
   * It can be one of: 'mersenne', 'congruential', 'congruential32', 'xorshift128plus'
   * Or any function able to build a `RandomGenerator` based on a seed
   */
  randomType?: RandomType | ((seed: number) => RandomGenerator);
  /**
   * Number of runs before success: 100 by default
   */
  numRuns?: number;
  /**
   * Maximal number of skipped values per run
   *
   * Skipped is considered globally, so this value is used to compute maxSkips = maxSkipsPerRun * numRuns.
   * Runner will consider a run to have failed if it skipped maxSkips+1 times before having generated numRuns valid entries.
   *
   * See {@link pre} for more details on pre-conditions
   */
  maxSkipsPerRun?: number;
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
   * Enable verbose mode: {@link VerbosityLevel.None} by default
   *
   * Using `verbose: true` is equivalent to `verbose: VerbosityLevel.Verbose`
   *
   * It can prove very useful to troubleshoot issues.
   * See {@link VerbosityLevel} for more details on each level.
   */
  verbose?: boolean | VerbosityLevel;
  /**
   * Custom values added at the beginning of generated ones
   *
   * It enables users to come with examples they want to test at every run
   */
  examples?: T[];
}
