import type { DoubleConstraints } from '../../double';

const safeNumberIsInteger = Number.isInteger;
const safeObjectIs = Object.is;

const safeNegativeInfinity = Number.NEGATIVE_INFINITY;
const safePositiveInfinity = Number.POSITIVE_INFINITY;
const safeMaxValue = Number.MAX_VALUE;

// The last floating point value available with 64 bits floating point numbers is: 4503599627370495.5
// The start of integers' world is: 4503599627370496 = 2**52 = 2**(significand_size_with_sign-1)
export const maxNonIntegerValue = 4503599627370495.5;
export const onlyIntegersAfterThisValue = 4503599627370496;

/**
 * Refine source constraints receive by a double to focus only on non-integer values.
 * @param constraints - Source constraints to be refined
 */
export function refineConstraintsForDoubleOnly(
  constraints: Omit<DoubleConstraints, 'noInteger'>,
): Required<Omit<DoubleConstraints, 'noInteger'>> {
  const {
    noDefaultInfinity = false,
    minExcluded = false,
    maxExcluded = false,
    min = noDefaultInfinity ? -safeMaxValue : safeNegativeInfinity,
    max = noDefaultInfinity ? safeMaxValue : safePositiveInfinity,
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

export function doubleOnlyMapper(value: number): number {
  return value === onlyIntegersAfterThisValue
    ? safePositiveInfinity
    : value === -onlyIntegersAfterThisValue
      ? safeNegativeInfinity
      : value;
}

export function doubleOnlyUnmapper(value: unknown): number {
  if (typeof value !== 'number') throw new Error('Unsupported type');
  return value === safePositiveInfinity
    ? onlyIntegersAfterThisValue
    : value === safeNegativeInfinity
      ? -onlyIntegersAfterThisValue
      : value;
}
