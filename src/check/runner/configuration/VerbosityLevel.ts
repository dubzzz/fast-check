/**
 * Verbosity level
 */
export const enum VerbosityLevel {
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
   * - {@link VerbosityLevel.None}
   * - list all the failures encountered during the shrinking process
   */
  Verbose = 1,
  /**
   * Level 2
   *
   * Execution flow reporting:
   * - {@link VerbosityLevel.None}
   * - all runs with their associated status displayed as a tree
   */
  VeryVerbose = 2
}
