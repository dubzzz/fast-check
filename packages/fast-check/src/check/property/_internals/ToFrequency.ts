/**
 * Convert runId into a frequency
 *
 * @param runId - Id of the run starting at 0
 * @returns Frequency of bias starting at 2
 */
export function runIdToFrequency(runId: number): number {
  // For small integer run ids, the frequency changes at 10**n - 1.
  // Avoid logarithms for common run counts, including runs skipped by preconditions.
  if (runId >= 0 && runId < 999999 && Number.isInteger(runId)) {
    if (runId < 999) {
      if (runId < 9) return 2;
      return runId < 99 ? 3 : 4;
    }
    if (runId < 9999) return 5;
    return runId < 99999 ? 6 : 7;
  }
  // Preserve the original rounding for large run ids and other numeric inputs.
  // 0.4342944819032518 = 1 / log(10)
  return 2 + ~~(Math.log(runId + 1) * 0.4342944819032518);
}
