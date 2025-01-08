import * as fc from 'fast-check';
import type { DoubleConstraints } from '../../../../src/arbitrary/double';
import type { FloatConstraints } from '../../../../src/arbitrary/float';
import { MAX_VALUE_32, floatToIndex } from '../../../../src/arbitrary/_internals/helpers/FloatHelpers';
import { doubleToIndex } from '../../../../src/arbitrary/_internals/helpers/DoubleHelpers';
import { substract64 } from '../../../../src/arbitrary/_internals/helpers/ArrayInt64';
import { refineConstraintsForDoubleOnly } from '../../../../src/arbitrary/_internals/helpers/DoubleOnlyHelpers';
import { refineConstraintsForFloatOnly } from '../../../../src/arbitrary/_internals/helpers/FloatOnlyHelpers';

export function float32raw(): fc.Arbitrary<number> {
  return fc.integer().map((n32) => new Float32Array(new Int32Array([n32]).buffer)[0]);
}

export function float64raw(): fc.Arbitrary<number> {
  return fc
    .tuple(fc.integer(), fc.integer())
    .map(([na32, nb32]) => new Float64Array(new Int32Array([na32, nb32]).buffer)[0]);
}

export const defaultFloatRecordConstraints = {
  min: float32raw(),
  max: float32raw(),
  noDefaultInfinity: fc.boolean(),
  noNaN: fc.boolean(),
  noInteger: fc.boolean(),
  minExcluded: fc.boolean(),
  maxExcluded: fc.boolean(),
};

export const defaultDoubleRecordConstraints = {
  min: float64raw(),
  max: float64raw(),
  noDefaultInfinity: fc.boolean(),
  noNaN: fc.boolean(),
  noInteger: fc.boolean(),
  minExcluded: fc.boolean(),
  maxExcluded: fc.boolean(),
};

type ConstraintsInternalOut = FloatConstraints & DoubleConstraints;
type ConstraintsInternal = {
  [K in keyof ConstraintsInternalOut]?: fc.Arbitrary<ConstraintsInternalOut[K]>;
};
function constraintsInternal(
  recordConstraints: ConstraintsInternal,
  is32Bits: boolean,
): fc.Arbitrary<ConstraintsInternalOut> {
  return fc
    .record(recordConstraints, { requiredKeys: [] })
    .filter((ct) => {
      // Forbid min and max to be NaN
      return (ct.min === undefined || !Number.isNaN(ct.min)) && (ct.max === undefined || !Number.isNaN(ct.max));
    })
    .map((ct) => {
      // Already valid ct, no min or no max: we just return it as-is
      if (ct.min === undefined || ct.max === undefined) return ct;
      const { min, max } = ct;
      // Already valid ct, min < max: we just return it as-is
      if (min < max) return ct;
      // Already valid ct, min <= max with -0 and 0 correctly ordered: we just return it as-is
      if (min === max && (min !== 0 || 1 / min <= 1 / max)) return ct;
      // We have to exchange min and  max to get an ordered range
      return { ...ct, min: max, max: min };
    })
    .filter((ct) => {
      // No issue when automatically defaulting to +/-inf
      if (!ct.noDefaultInfinity) return true;
      // Invalid range, cannot have min==inf if max has to default to +max_value
      if (ct.min === Number.POSITIVE_INFINITY && ct.max === undefined) return false;
      // Invalid range, cannot have max=-inf if min has to default to -max_value
      if (ct.min === undefined && ct.max === Number.NEGATIVE_INFINITY) return false;
      return true;
    })
    .filter((ct) => {
      const defaultMax = ct.noDefaultInfinity ? (is32Bits ? MAX_VALUE_32 : Number.MAX_VALUE) : Number.POSITIVE_INFINITY;
      const min = ct.min !== undefined ? ct.min : -defaultMax;
      const max = ct.max !== undefined ? ct.max : defaultMax;
      // Illegal range, values cannot be "min < value <= min" or "min <= value < min" or "min < value < min"
      if ((ct.minExcluded || ct.maxExcluded) && min === max) return false;
      // Always valid range given min !== max if min=-inf or max=+inf
      if (ct.max === Number.POSITIVE_INFINITY || ct.min === Number.NEGATIVE_INFINITY) return true;
      if (ct.minExcluded && ct.maxExcluded) {
        if (is32Bits) {
          const minIndex = floatToIndex(min);
          const maxIndex = floatToIndex(max);
          const distance = maxIndex - minIndex;
          // Illegal range, no value in range if min and max are too close from each others and both excluded
          if (distance === 1) return false;
        } else {
          const minIndex = doubleToIndex(min);
          const maxIndex = doubleToIndex(max);
          const distance = substract64(maxIndex, minIndex);
          // Illegal range, no value in range if min and max are too close from each others and both excluded
          if (distance.data[0] === 0 && distance.data[1] === 1) return false;
        }
      }
      return true;
    })
    .filter((ct) => {
      if (!ct.noInteger) return true;
      if (is32Bits) {
        const resolvedCt = refineConstraintsForFloatOnly(ct);
        if (resolvedCt.min > resolvedCt.max) return false;
        const minIndex = floatToIndex(resolvedCt.min);
        const maxIndex = floatToIndex(resolvedCt.max);
        const distance = maxIndex - minIndex;
        // Dangerous range, not enough value in range to safely run
        // Worst broken cases:
        // >  {float, int, float} with distance 2 such as from 8388606.5 (excl.) to 8388607.5 (excl.)
        // >  {float, -0, 0}      with distance 2 such as from -MIN_VALUE (excl.) to 0
        // >  {-0, 0, float}      with distance 2 such as from 0 to MIN_VALUE (excl.)
        // -> for >= 3 it's safe, we will always have a non-integer value within the range
        if (distance < 3) return false;
      } else {
        const resolvedCt = refineConstraintsForDoubleOnly(ct);
        if (resolvedCt.min > resolvedCt.max) return false;
        const minIndex = doubleToIndex(resolvedCt.min);
        const maxIndex = doubleToIndex(resolvedCt.max);
        const distance = substract64(maxIndex, minIndex);
        // Dangerous range, not enough value in range to safely run
        // Worst broken cases:
        // >  {float, int, float} with distance 2 such as from 4503599627370494.5 (excl.) to 4503599627370495.5 (excl.)
        // >  {float, -0, 0}      with distance 2 such as from -MIN_VALUE (excl.) to 0
        // >  {-0, 0, float}      with distance 2 such as from 0 to MIN_VALUE (excl.)
        // -> for >= 3 it's safe, we will always have a non-integer value within the range
        if (distance.data[0] === 0 && distance.data[1] < 3) return false;
      }
      return true;
    });
}

export function floatConstraints(
  recordConstraints: Partial<typeof defaultFloatRecordConstraints> = defaultFloatRecordConstraints,
): fc.Arbitrary<FloatConstraints> {
  return constraintsInternal(recordConstraints, true);
}

export function doubleConstraints(
  recordConstraints: Partial<typeof defaultDoubleRecordConstraints> = defaultDoubleRecordConstraints,
): fc.Arbitrary<DoubleConstraints> {
  return constraintsInternal(recordConstraints, false);
}

export function isStrictlySmaller(fa: number, fb: number): boolean {
  if (fa === 0 && fb === 0) return 1 / fa < 1 / fb;
  return fa < fb;
}

export function is32bits(f64: number): boolean {
  return Object.is(new Float32Array([f64])[0], f64);
}

export function isNotNaN32bits(f64: number): boolean {
  return !Number.isNaN(f64) && is32bits(f64);
}

export function isFiniteNotNaN32bits(f64: number): boolean {
  return Number.isFinite(f64) && isNotNaN32bits(f64);
}
