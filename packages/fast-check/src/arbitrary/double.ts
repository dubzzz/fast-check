import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { doubleToIndex, indexToDouble, NAN_64_VALUES } from './_internals/helpers/DoubleHelpers.js';
import {
  doubleOnlyMapper,
  doubleOnlyUnmapper,
  refineConstraintsForDoubleOnly,
} from './_internals/helpers/DoubleOnlyHelpers.js';
import { bigInt } from './bigInt.js';
import { BigInt } from '../utils/globals.js';

const safeNumberIsInteger = Number.isInteger;
const safeNumberIsNaN = Number.isNaN;

const safeNegativeInfinity = Number.NEGATIVE_INFINITY;
const safePositiveInfinity = Number.POSITIVE_INFINITY;
const safeMaxValue = Number.MAX_VALUE;

// NAN_64_VALUES[2] and NAN_64_VALUES[3] are two distinct, non-canonical, 64-bit NaN bit patterns (see
// DoubleHelpers.ts for the full list). We deliberately do not use NAN_64_VALUES[0] (the canonical NaN) below:
// see the comment next to their usage in anyDouble for the rationale. We also avoid the signaling patterns
// (index 1 and 4): some engines quiet signaling NaNs (flipping their quiet bit) when they transit through a
// TypedArray, which would silently turn them into yet another (still non-canonical, but unplanned) pattern.
// Patterns 2 and 3 are already quiet, so they are not affected by that.
const nonCanonicalNaNAfterMax = NAN_64_VALUES[2];
const nonCanonicalNaNBeforeMin = NAN_64_VALUES[3];

/**
 * Constraints to be applied on {@link double}
 * @remarks Since 2.6.0
 * @public
 */
export interface DoubleConstraints {
  /**
   * Lower bound for the generated 64-bit floats (included, see minExcluded to exclude it)
   * @defaultValue Number.NEGATIVE_INFINITY, -1.7976931348623157e+308 when noDefaultInfinity is true
   * @remarks Since 2.8.0
   */
  min?: number;
  /**
   * Should the lower bound (aka min) be excluded?
   * Note: Excluding min=Number.NEGATIVE_INFINITY would result into having min set to -Number.MAX_VALUE.
   * @defaultValue false
   * @remarks Since 3.12.0
   */
  minExcluded?: boolean;
  /**
   * Upper bound for the generated 64-bit floats (included, see maxExcluded to exclude it)
   * @defaultValue Number.POSITIVE_INFINITY, 1.7976931348623157e+308 when noDefaultInfinity is true
   * @remarks Since 2.8.0
   */
  max?: number;
  /**
   * Should the upper bound (aka max) be excluded?
   * Note: Excluding max=Number.POSITIVE_INFINITY would result into having max set to Number.MAX_VALUE.
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
 * Same as {@link doubleToIndex} except it throws in case of invalid double (NaN)
 *
 * @internal
 */
function safeDoubleToIndex(d: number, constraintsLabel: keyof DoubleConstraints): bigint {
  if (safeNumberIsNaN(d)) {
    // Number.NaN does not have any associated index in the current implementation
    throw new Error('fc.double constraints.' + constraintsLabel + ' must be a 64-bit float');
  }
  return doubleToIndex(d);
}

/** @internal */
function unmapperDoubleToIndex(value: unknown): bigint {
  if (typeof value !== 'number') throw new Error('Unsupported type');
  return doubleToIndex(value);
}

/** @internal */
function numberIsNotInteger(value: number): boolean {
  return !safeNumberIsInteger(value);
}

/** @internal */
function anyDouble(constraints: Omit<DoubleConstraints, 'noInteger'>): Arbitrary<number> {
  const {
    noDefaultInfinity = false,
    noNaN = false,
    minExcluded = false,
    maxExcluded = false,
    min = noDefaultInfinity ? -safeMaxValue : safeNegativeInfinity,
    max = noDefaultInfinity ? safeMaxValue : safePositiveInfinity,
  } = constraints;
  const minIndexRaw = safeDoubleToIndex(min, 'min');
  const minIndex = minExcluded ? minIndexRaw + BigInt(1) : minIndexRaw;
  const maxIndexRaw = safeDoubleToIndex(max, 'max');
  const maxIndex = maxExcluded ? maxIndexRaw - BigInt(1) : maxIndexRaw;
  if (maxIndex < minIndex) {
    // In other words: minIndex > maxIndex
    // Comparing min and max might be problematic in case min=+0 and max=-0
    // For that reason, we prefer to compare computed index to be safer
    throw new Error('fc.double constraints.min must be smaller or equal to constraints.max');
  }
  if (noNaN) {
    return bigInt({ min: minIndex, max: maxIndex }).map(indexToDouble, unmapperDoubleToIndex);
  }
  // In case maxIndex > 0 or in other words max > 0,
  //   values will be [min, ..., +0, ..., max, NaN]
  //               or [min, ..., max, NaN] if min > +0
  // Otherwise,
  //   values will be [NaN, min, ..., max] with max <= +0
  //
  // We keep a single extra index dedicated to NaN, exactly as before: widening it to host several possible NaN
  // bit patterns would mean drawing extra randomness for it, which showed to destabilize the shrinker of the
  // underlying bigInt arbitrary on arrays of doubles (see #6532 discussion for details, and in particular the
  // existing "shrink without any initial context" contract that float32Array/float64Array rely on).
  //
  // Instead, we reuse this single index to surface a non-canonical NaN bit pattern (rather than the canonical
  // Number.NaN that used to be hardcoded here): NaN values are indistinguishable from each other at the
  // language level (Number.isNaN, ===, Object.is...) so nothing that inspects the produced value the "normal"
  // way can ever notice this change - it only becomes observable when writing the value into a Float64Array,
  // which is exactly the scenario reported in #6532. We use two different bit patterns (one for each side of
  // the range) so that, depending on their constraints, users can stumble upon more than a single pattern.
  const positiveMaxIdx = maxIndex > BigInt(0);
  const minIndexWithNaN = positiveMaxIdx ? minIndex : minIndex - BigInt(1);
  const maxIndexWithNaN = positiveMaxIdx ? maxIndex + BigInt(1) : maxIndex;
  const nanForRange = positiveMaxIdx ? nonCanonicalNaNAfterMax : nonCanonicalNaNBeforeMin;
  return bigInt({ min: minIndexWithNaN, max: maxIndexWithNaN }).map(
    (index) => {
      if (maxIndex < index || index < minIndex) return nanForRange;
      else return indexToDouble(index);
    },
    (value) => {
      if (typeof value !== 'number') throw new Error('Unsupported type');
      if (safeNumberIsNaN(value)) return maxIndex !== maxIndexWithNaN ? maxIndexWithNaN : minIndexWithNaN;
      return doubleToIndex(value);
    },
  );
}

/**
 * For 64-bit floating point numbers:
 * - sign: 1 bit
 * - significand: 52 bits
 * - exponent: 11 bits
 *
 * @param constraints - Constraints to apply when building instances (since 2.8.0)
 *
 * @remarks Since 0.0.6
 * @public
 */
export function double(constraints: DoubleConstraints = {}): Arbitrary<number> {
  if (!constraints.noInteger) {
    return anyDouble(constraints);
  }
  return anyDouble(refineConstraintsForDoubleOnly(constraints))
    .map(doubleOnlyMapper, doubleOnlyUnmapper)
    .filter(numberIsNotInteger);
}
