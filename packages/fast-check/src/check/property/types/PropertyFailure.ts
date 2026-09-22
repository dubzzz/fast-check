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
