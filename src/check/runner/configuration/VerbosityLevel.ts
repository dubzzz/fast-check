/**
 * Verbosity level
 * @public
 */
export enum VerbosityLevel {
  /**
   * Level 0 (default)
   *
   * Minimal reporting:
   * - minimal failing case
   * - error log corresponding to the minimal failing case
   */
  None = 0,
  /**
   * Level 1
   *
   * Failures reporting:
   * - same as `VerbosityLevel.None`
   * - list all the failures encountered during the shrinking process
   */
  Verbose = 1,
  /**
   * Level 2
   *
   * Execution flow reporting:
   * - same as `VerbosityLevel.None`
   * - all runs with their associated status displayed as a tree
   */
  VeryVerbose = 2,
}
