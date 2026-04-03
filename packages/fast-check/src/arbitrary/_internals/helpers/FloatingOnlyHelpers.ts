import type { DoubleConstraints } from '../../double.js';



/** @internals */
export function refineConstraintsForFloatingOnly(
  constraints: Omit<DoubleConstraints, 'noInteger'>,
  maxValue: number,
  maxNonIntegerValue: number,
  onlyIntegersAfterThisValue: number,
): Required<Omit<DoubleConstraints, 'noInteger'>> {
  const {
    noDefaultInfinity = false,
    minExcluded = false,
    maxExcluded = false,
    min = noDefaultInfinity ? -maxValue : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? maxValue : Number.POSITIVE_INFINITY,
  } = constraints;

  const effectiveMin = minExcluded
    ? min < -maxNonIntegerValue
      ? -onlyIntegersAfterThisValue
      : Math.max(min, -maxNonIntegerValue)
    : min === Number.NEGATIVE_INFINITY
      ? Math.max(min, -onlyIntegersAfterThisValue)
      : Math.max(min, -maxNonIntegerValue);
  const effectiveMax = maxExcluded
    ? max > maxNonIntegerValue
      ? onlyIntegersAfterThisValue
      : Math.min(max, maxNonIntegerValue)
    : max === Number.POSITIVE_INFINITY
      ? Math.min(max, onlyIntegersAfterThisValue)
      : Math.min(max, maxNonIntegerValue);

  const fullConstraints: Required<Omit<DoubleConstraints, 'noInteger'>> = {
    noDefaultInfinity: false, // already handled locally
    minExcluded: minExcluded || ((min !== Number.NEGATIVE_INFINITY || minExcluded) && Number.isInteger(effectiveMin)), // exclusion still need to be applied, but might be altered to be more precise
    maxExcluded: maxExcluded || ((max !== Number.POSITIVE_INFINITY || maxExcluded) && Number.isInteger(effectiveMax)),
    min: Object.is(effectiveMin, -0) ? 0 : effectiveMin,
    max: Object.is(effectiveMax, 0) ? -0 : effectiveMax,
    noNaN: constraints.noNaN || false,
  };
  return fullConstraints;
}
