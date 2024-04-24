import type { DoubleConstraints } from '../../double';

const safeNumberIsInteger = Number.isInteger;
const safeObjectIs = Object.is;

const safeNegativeInfinity = Number.NEGATIVE_INFINITY;
const safePositiveInfinity = Number.POSITIVE_INFINITY;

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
    min = noDefaultInfinity ? -maxValue : safeNegativeInfinity,
    max = noDefaultInfinity ? maxValue : safePositiveInfinity,
  } = constraints;

  const effectiveMin = minExcluded
    ? min < -maxNonIntegerValue
      ? -onlyIntegersAfterThisValue
      : Math.max(min, -maxNonIntegerValue)
    : min === safeNegativeInfinity
      ? Math.max(min, -onlyIntegersAfterThisValue)
      : Math.max(min, -maxNonIntegerValue);
  const effectiveMax = maxExcluded
    ? max > maxNonIntegerValue
      ? onlyIntegersAfterThisValue
      : Math.min(max, maxNonIntegerValue)
    : max === safePositiveInfinity
      ? Math.min(max, onlyIntegersAfterThisValue)
      : Math.min(max, maxNonIntegerValue);

  const fullConstraints: Required<Omit<DoubleConstraints, 'noInteger'>> = {
    noDefaultInfinity: false, // already handled locally
    minExcluded: minExcluded || ((min !== safeNegativeInfinity || minExcluded) && safeNumberIsInteger(effectiveMin)), // exclusion still need to be applied, but might be altered to be more precise
    maxExcluded: maxExcluded || ((max !== safePositiveInfinity || maxExcluded) && safeNumberIsInteger(effectiveMax)),
    min: safeObjectIs(effectiveMin, -0) ? 0 : effectiveMin,
    max: safeObjectIs(effectiveMax, 0) ? -0 : effectiveMax,
    noNaN: constraints.noNaN || false,
  };
  return fullConstraints;
}
