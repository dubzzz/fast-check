import type { DoubleConstraints } from '../../double.js';
import { refineConstraintsForFloatingOnly } from './FloatingOnlyHelpers.js';


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
  return refineConstraintsForFloatingOnly(constraints, Number.MAX_VALUE, maxNonIntegerValue, onlyIntegersAfterThisValue);
}

export function doubleOnlyMapper(value: number): number {
  return value === onlyIntegersAfterThisValue
    ? Number.POSITIVE_INFINITY
    : value === -onlyIntegersAfterThisValue
      ? Number.NEGATIVE_INFINITY
      : value;
}

export function doubleOnlyUnmapper(value: unknown): number {
  if (typeof value !== 'number') throw new Error('Unsupported type');
  return value === Number.POSITIVE_INFINITY
    ? onlyIntegersAfterThisValue
    : value === Number.NEGATIVE_INFINITY
      ? -onlyIntegersAfterThisValue
      : value;
}
