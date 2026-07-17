/**
 * Convert runId into a frequency
 *
 * @param runId - Id of the run starting at 0
 * @returns Frequency of bias starting at 2
 *
 * @internal
 */
export function runIdToFrequency(runId: number): number {
  // 0.4342944819032518 = 1 / log(10)
  return 2 + ~~(Math.log(runId + 1) * 0.4342944819032518);
}
