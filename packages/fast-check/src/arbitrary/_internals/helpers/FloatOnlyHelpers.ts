import type { FloatConstraints } from '../../float.js';
import { MAX_VALUE_32 } from './FloatHelpers.js';
import { refineConstraintsForFloatingOnly } from './FloatingOnlyHelpers.js';

const safeNegativeInfinity = Number.NEGATIVE_INFINITY;
const safePositiveInfinity = Number.POSITIVE_INFINITY;
const safeMaxValue = MAX_VALUE_32;

// The last floating point value available with 32 bits floating point numbers is: 8388607.5
// The start of integers' world is: 8388608 = 2**23 = 2**(significand_size_with_sign-1)
export const maxNonIntegerValue = 8388607.5;
export const onlyIntegersAfterThisValue = 8388608;

/**
 * Refine source constraints receive by a float to focus only on non-integer values.
 * @param constraints - Source constraints to be refined
 */
export function refineConstraintsForFloatOnly(
  constraints: Omit<FloatConstraints, 'noInteger'>,
): Required<Omit<FloatConstraints, 'noInteger'>> {
  return refineConstraintsForFloatingOnly(constraints, safeMaxValue, maxNonIntegerValue, onlyIntegersAfterThisValue);
}

export function floatOnlyMapper(value: number): number {
  return value === onlyIntegersAfterThisValue
    ? safePositiveInfinity
    : value === -onlyIntegersAfterThisValue
      ? safeNegativeInfinity
      : value;
}

export function floatOnlyUnmapper(value: unknown): number {
  const v = value as number;
  return v === safePositiveInfinity
    ? onlyIntegersAfterThisValue
    : v === safeNegativeInfinity
      ? -onlyIntegersAfterThisValue
      : v;
}
