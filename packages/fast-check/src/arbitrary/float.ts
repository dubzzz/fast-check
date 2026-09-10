import { integer } from './integer.js';
import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { floatToIndex, indexToFloat, MAX_VALUE_32, NAN_32_VALUES } from './_internals/helpers/FloatHelpers.js';
import {
  floatOnlyMapper,
  floatOnlyUnmapper,
  refineConstraintsForFloatOnly,
} from './_internals/helpers/FloatOnlyHelpers.js';

const safeNumberIsInteger = Number.isInteger;
const safeNumberIsNaN = Number.isNaN;
const safeMathFround = Math.fround;

const safeNegativeInfinity = Number.NEGATIVE_INFINITY;
const safePositiveInfinity = Number.POSITIVE_INFINITY;

// NAN_32_VALUES[2] and NAN_32_VALUES[3] are two distinct, non-canonical, 32-bit NaN bit patterns (see
// FloatHelpers.ts for the full list). We deliberately do not use NAN_32_VALUES[0] (the canonical NaN) below: see
// the comment next to their usage in anyFloat for the rationale. We also avoid the signaling patterns
// (index 1 and 4): some engines quiet signaling NaNs (flipping their quiet bit) when they transit through a
// TypedArray, which would silently turn them into yet another (still non-canonical, but unplanned) pattern.
// Patterns 2 and 3 are already quiet, so they are not affected by that.
const nonCanonicalNaNAfterMax = NAN_32_VALUES[2];
const nonCanonicalNaNBeforeMin = NAN_32_VALUES[3];

/**
 * Constraints to be applied on {@link float}
 * @remarks Since 2.6.0
 * @public
 */
export interface FloatConstraints {
  /**
   * Lower bound for the generated 32-bit floats (included)
   * @defaultValue Number.NEGATIVE_INFINITY, -3.4028234663852886e+38 when noDefaultInfinity is true
   * @remarks Since 2.8.0
   */
  min?: number;
  /**
   * Should the lower bound (aka min) be excluded?
   * Note: Excluding min=Number.NEGATIVE_INFINITY would result into having min set to -3.4028234663852886e+38.
   * @defaultValue false
   * @remarks Since 3.12.0
   */
  minExcluded?: boolean;
  /**
   * Upper bound for the generated 32-bit floats (included)
   * @defaultValue Number.POSITIVE_INFINITY, 3.4028234663852886e+38 when noDefaultInfinity is true
   * @remarks Since 2.8.0
   */
  max?: number;
  /**
   * Should the upper bound (aka max) be excluded?
   * Note: Excluding max=Number.POSITIVE_INFINITY would result into having max set to 3.4028234663852886e+38.
   * @defaultValue false
   * @remarks Since 3.12.0
   */
  maxExcluded?: boolean;
  /**
   * By default, lower and upper bounds are -infinity and +infinity.
   * By setting noDefaultInfinity to true, you move those defaults to minimal and maximal finite values.
   * @defaultValue false
   * @remarks Since 2.8.0
   */
  noDefaultInfinity?: boolean;
  /**
   * When set to true, no more Number.NaN can be generated.
   * @defaultValue false
   * @remarks Since 2.8.0
   */
  noNaN?: boolean;
  /**
   * When set to true, Number.isInteger(value) will be false for any generated value.
   * Note: -infinity and +infinity, or NaN can stil be generated except if you rejected them via another constraint.
   * @defaultValue false
   * @remarks Since 3.18.0
   */
  noInteger?: boolean;
}

/**
 * Same as {@link floatToIndex} except it throws if f is NaN or not representable as a 32-bit float
 *
 * @internal
 */
function safeFloatToIndex(f: number, constraintsLabel: keyof FloatConstraints) {
  const conversionTrick = 'you can convert any double to a 32-bit float by using `Math.fround(myDouble)`';
  const errorMessage = 'fc.float constraints.' + constraintsLabel + ' must be a 32-bit float - ' + conversionTrick;
  if (safeNumberIsNaN(f) || safeMathFround(f) !== f) {
    // Number.NaN does not have any associated index in the current implementation
    // If the value isn't the same after fround(), it can't be represented as a 32-bit float
    throw new Error(errorMessage);
  }
  return floatToIndex(f);
}

/** @internal */
function unmapperFloatToIndex(value: unknown): number {
  if (typeof value !== 'number') throw new Error('Unsupported type');
  return floatToIndex(value);
}

/** @internal */
function numberIsNotInteger(value: number): boolean {
  return !safeNumberIsInteger(value);
}

function anyFloat(constraints: Omit<FloatConstraints, 'noInteger'>): Arbitrary<number> {
  const {
    noDefaultInfinity = false,
    noNaN = false,
    minExcluded = false,
    maxExcluded = false,
    min = noDefaultInfinity ? -MAX_VALUE_32 : safeNegativeInfinity,
    max = noDefaultInfinity ? MAX_VALUE_32 : safePositiveInfinity,
  } = constraints;
  const minIndexRaw = safeFloatToIndex(min, 'min');
  const minIndex = minExcluded ? minIndexRaw + 1 : minIndexRaw;
  const maxIndexRaw = safeFloatToIndex(max, 'max');
  const maxIndex = maxExcluded ? maxIndexRaw - 1 : maxIndexRaw;
  if (minIndex > maxIndex) {
    // Comparing min and max might be problematic in case min=+0 and max=-0
    // For that reason, we prefer to compare computed index to be safer
    throw new Error('fc.float constraints.min must be smaller or equal to constraints.max');
  }
  if (noNaN) {
    return integer({ min: minIndex, max: maxIndex }).map(indexToFloat, unmapperFloatToIndex);
  }
  // In case maxIndex > 0 or in other words max > 0,
  //   values will be [min, ..., +0, ..., max, NaN]
  //               or [min, ..., max, NaN] if min > +0
  // Otherwise,
  //   values will be [NaN, min, ..., max] with max <= +0
  //
  // We keep a single extra index dedicated to NaN, exactly as before: widening it to host several possible NaN
  // bit patterns would mean drawing extra randomness for it, which showed to destabilize the shrinker of the
  // underlying integer arbitrary on arrays of floats (see #6532 discussion for details, and in particular the
  // existing "shrink without any initial context" contract that float32Array/float64Array rely on).
  //
  // Instead, we reuse this single index to surface a non-canonical NaN bit pattern (rather than the canonical
  // Number.NaN that used to be hardcoded here): NaN values are indistinguishable from each other at the
  // language level (Number.isNaN, ===, Object.is...) so nothing that inspects the produced value the "normal"
  // way can ever notice this change - it only becomes observable when writing the value into a Float32Array,
  // which is exactly the scenario reported in #6532. We use two different bit patterns (one for each side of
  // the range) so that, depending on their constraints, users can stumble upon more than a single pattern.
  const minIndexWithNaN = maxIndex > 0 ? minIndex : minIndex - 1;
  const maxIndexWithNaN = maxIndex > 0 ? maxIndex + 1 : maxIndex;
  const nanForRange = maxIndex > 0 ? nonCanonicalNaNAfterMax : nonCanonicalNaNBeforeMin;
  return integer({ min: minIndexWithNaN, max: maxIndexWithNaN }).map(
    (index) => {
      if (index > maxIndex || index < minIndex) return nanForRange;
      else return indexToFloat(index);
    },
    (value) => {
      if (typeof value !== 'number') throw new Error('Unsupported type');
      if (safeNumberIsNaN(value)) return maxIndex !== maxIndexWithNaN ? maxIndexWithNaN : minIndexWithNaN;
      return floatToIndex(value);
    },
  );
}

/**
 * For 32-bit floating point numbers:
 * - sign: 1 bit
 * - significand: 23 bits
 * - exponent: 8 bits
 *
 * The smallest non-zero value (in absolute value) that can be represented by such float is: 2 ** -126 * 2 ** -23.
 * And the largest one is: 2 ** 127 * (1 + (2 ** 23 - 1) / 2 ** 23).
 *
 * @param constraints - Constraints to apply when building instances (since 2.8.0)
 *
 * @remarks Since 0.0.6
 * @public
 */
export function float(constraints: FloatConstraints = {}): Arbitrary<number> {
  if (!constraints.noInteger) {
    return anyFloat(constraints);
  }
  return anyFloat(refineConstraintsForFloatOnly(constraints))
    .map(floatOnlyMapper, floatOnlyUnmapper)
    .filter(numberIsNotInteger);
}
