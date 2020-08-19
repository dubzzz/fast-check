import { VerbosityLevel } from '../configuration/VerbosityLevel';
import { ExecutionTree } from './ExecutionTree';
import { Parameters } from '../configuration/Parameters';

/**
 * Post-run details produced by {@link fast-check#(check:1)}
 *
 * A failing property can easily detected by checking the `failed` flag of this structure
 *
 * @public
 */
export type RunDetails<Ts> =
  | RunDetailsFailureProperty<Ts>
  | RunDetailsFailureTooManySkips<Ts>
  | RunDetailsFailureInterrupted<Ts>
  | RunDetailsSuccess<Ts>;

/**
 * Run reported as failed because
 * the property failed
 *
 * @public
 */
export type RunDetailsFailureProperty<Ts> = RunDetailsCommon<Ts> & {
  failed: true;
  interrupted: boolean;
  counterexample: Ts;
  counterexamplePath: string;
  error: string;
};

/**
 * Run reported as failed because
 * too many retries have been attempted to generate valid values
 *
 * @public
 */
export type RunDetailsFailureTooManySkips<Ts> = RunDetailsCommon<Ts> & {
  failed: true;
  interrupted: false;
  counterexample: null;
  counterexamplePath: null;
  error: null;
};

/**
 * Run reported as failed because
 * it took too long and thus has been interrupted
 *
 * @public
 */
export type RunDetailsFailureInterrupted<Ts> = RunDetailsCommon<Ts> & {
  failed: true;
  interrupted: true;
  counterexample: null;
  counterexamplePath: null;
  error: null;
};

/**
 * Run reported as success
 * @public
 */
export type RunDetailsSuccess<Ts> = RunDetailsCommon<Ts> & {
  failed: false;
  interrupted: boolean;
  counterexample: null;
  counterexamplePath: null;
  error: null;
};

/**
 * Shared part between variants of RunDetails
 * @public
 */
export type RunDetailsCommon<Ts> = {
  /**
   * Does the property failed during the execution of {@link fast-check#(check:1)}?
   */
  failed: boolean;
  /**
   * Was the execution interrupted?
   */
  interrupted: boolean;
  /**
   * Number of runs
   *
   * - In case of failed property: Number of runs up to the first failure (including the failure run)
   * - Otherwise: Number of successful executions
   */
  numRuns: number;
  /**
   * Number of skipped entries due to failed pre-condition
   *
   * As `numRuns` it only takes into account the skipped values that occured before the first failure.
   * Refer to {@link fast-check#pre} to add such pre-conditions.
   */
  numSkips: number;
  /**
   * Number of shrinks required to get to the minimal failing case (aka counterexample)
   */
  numShrinks: number;
  /**
   * Seed that have been used by the run
   *
   * It can be forced in {@link fast-check#(assert:1)}, {@link fast-check#(check:1)}, {@link fast-check#sample} and {@link fast-check#statistics} using `Parameters`
   */
  seed: number;
  /**
   * In case of failure: the counterexample contains the minimal failing case (first failure after shrinking)
   */
  counterexample: Ts | null;
  /**
   * In case of failure: it contains the reason of the failure
   */
  error: string | null;
  /**
   * In case of failure: path to the counterexample
   *
   * For replay purposes, it can be forced in {@link fast-check#(assert:1)}, {@link fast-check#(check:1)}, {@link fast-check#sample} and {@link fast-check#statistics} using `Parameters`
   */
  counterexamplePath: string | null;
  /**
   * List all failures that have occurred during the run
   *
   * You must enable verbose with at least `Verbosity.Verbose` in `Parameters`
   * in order to have values in it
   */
  failures: Ts[];
  /**
   * Execution summary of the run
   *
   * Traces the origin of each value encountered during the test and its execution status.
   * Can help to diagnose shrinking issues.
   *
   * You must enable verbose with at least `Verbosity.Verbose` in `Parameters`
   * in order to have values in it:
   * - Verbose: Only failures
   * - VeryVerbose: Failures, Successes and Skipped
   */
  executionSummary: ExecutionTree<Ts>[];
  /**
   * Verbosity level required by the user
   */
  verbose: VerbosityLevel;
  /**
   * Configuration of the run
   *
   * It includes both local parameters set on `fc.assert` or `fc.check`
   * and global ones specified using `fc.configureGlobal`
   */
  runConfiguration: Parameters<Ts>;
};
