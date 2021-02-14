import { Arbitrary } from './definition/Arbitrary';
import { integer } from './IntegerArbitrary';

/** @internal */
export const MIN_VALUE_32 = 2 ** -126 * 2 ** -23;
/** @internal */
export const MAX_VALUE_32 = 2 ** 127 * (1 + (2 ** 23 - 1) / 2 ** 23);
/** @internal */
export const EPSILON_32 = 2 ** -23;

/** @internal */
const INDEX_POSITIVE_INFINITY = 2139095040; // floatToIndex(MAX_VALUE_32) + 1;
/** @internal */
const INDEX_NEGATIVE_INFINITY = -2139095041; // floatToIndex(-MAX_VALUE_32) - 1

/**
 * Decompose a 32-bit floating point number into a significand and exponent
 * such that:
 * - significand over 24 bits including sign (also referred as fraction)
 * - exponent over 8 bits including sign
 * - whenever there are multiple possibilities we take the one having the highest significand (in abs)
 *
 * Remark in 64-bit floating point number:
 * - significand is over 53 bits including sign
 * - exponent is over 11 bits including sign
 * - Number.MAX_VALUE = 2**1023    * (1 + (2**52-1)/2**52)
 * - Number.MIN_VALUE = 2**(-1022) * 2**(-52)
 * - Number.EPSILON   = 2**(-52)
 *
 * @param f - 32-bit floating point number to be decomposed into (significand, exponent)
 *
 * @internal
 */
export function decomposeFloat(f: number): { exponent: number; significand: number } {
  // 1 => significand 0b1   - exponent 1 (will be preferred)
  //   => significand 0b0.1 - exponent 2
  const maxSignificand = 1 + (2 ** 23 - 1) / 2 ** 23;
  for (let exponent = -126; exponent !== 128; ++exponent) {
    const powExponent = 2 ** exponent;
    const maxForExponent = maxSignificand * powExponent;
    if (Math.abs(f) <= maxForExponent) {
      return { exponent, significand: f / powExponent };
    }
  }
  return { exponent: Number.NaN, significand: Number.NaN };
}

/** @internal */
function indexInFloatFromDecomp(exponent: number, significand: number) {
  // WARNING: significand >= 0

  // By construct of significand in decomposeFloat,
  // significand is always max-ed.

  // The float close to zero are the only one having a significand <1, they also have an exponent of -126.
  // They are in range: [2**(-126) * 2**(-23), 2**(-126) * (2 - 2 ** 23)]
  // In other words there are 2**24 elements in that range if we include zero.
  // All other ranges (other exponents) have a length of 2**23 elements.
  if (exponent === -126) {
    return significand * 0x800000; // significand * 2**23
  }
  // Offset due to exp = -126 + Offset of previous exp (excl. -126) + Offset in current exp
  // 2**24 + (exponent - (-126) -1) * 2**23 + (significand - 1) * 2**23
  return (exponent + 127) * 0x800000 + (significand - 1) * 0x800000;
}

/**
 * Compute the index of f relative to other available 32-bit floating point numbers
 * Rq: Produces negative indexes for negative floats
 *
 * @param f - 32-bit floating point number
 *
 * @internal
 */
export function floatToIndex(f: number): number {
  if (f === Number.POSITIVE_INFINITY) {
    return INDEX_POSITIVE_INFINITY;
  }
  if (f === Number.NEGATIVE_INFINITY) {
    return INDEX_NEGATIVE_INFINITY;
  }
  const decomp = decomposeFloat(f);
  const exponent = decomp.exponent;
  const significand = decomp.significand;
  if (Number.isNaN(exponent) || Number.isNaN(significand) || !Number.isInteger(significand * 0x800000)) {
    return Number.NaN;
  }
  if (f > 0 || (f === 0 && 1 / f === Number.POSITIVE_INFINITY)) {
    return indexInFloatFromDecomp(exponent, significand);
  } else {
    return -indexInFloatFromDecomp(exponent, -significand) - 1;
  }
}

/**
 * Compute the 32-bit floating point number corresponding to the provided indexes
 *
 * @param n - index of the float
 *
 * @internal
 */
export function indexToFloat(index: number): number {
  if (index < 0) {
    return -indexToFloat(-index - 1);
  }
  if (index === INDEX_POSITIVE_INFINITY) {
    return Number.POSITIVE_INFINITY;
  }
  if (index < 0x1000000) {
    // The first 2**24 elements correspond to values having
    // exponent = -126 and significand = index * 2**(-23)
    return index * 2 ** -149;
  }
  const postIndex = index - 0x1000000;
  // Math.floor(postIndex / 0x800000) = Math.floor(postIndex / 2**23) = (postIndex >> 23)
  const exponent = -125 + (postIndex >> 23);
  // (postIndex % 0x800000) / 0x800000 = (postIndex & 0x7fffff) / 0x800000
  const significand = 1 + (postIndex & 0x7fffff) / 0x800000;
  return significand * 2 ** exponent;
}

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
   * Upper bound for the generated 32-bit floats (included)
   * @defaultValue Number.POSITIVE_INFINITY, 3.4028234663852886e+38 when noDefaultInfinity is true
   * @remarks Since 2.8.0
   */
  max?: number;
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
}

/**
 * Same as {@link floatToIndex} except it throws in case of invalid float 32
 *
 * @internal
 */
function safeFloatToIndex(f: number, constraintsLabel: keyof FloatConstraints) {
  const conversionTrick = 'you can convert any double to a 32-bit float by using `new Float32Array([myDouble])[0]`';
  const errorMessage = 'fc.float constraints.' + constraintsLabel + ' must be a 32-bit float - ' + conversionTrick;
  if (Number.isNaN(f) || (Number.isFinite(f) && (f < -MAX_VALUE_32 || f > MAX_VALUE_32))) {
    // Number.NaN does not have any associated index in the current implementation
    // Finite values outside of the 32-bit range for floats cannot be 32-bit floats
    throw new Error(errorMessage);
  }
  const index = floatToIndex(f);
  if (!Number.isInteger(index)) {
    // Index not being an integer means that original value was not a valid 32-bit float
    throw new Error(errorMessage);
  }
  return index;
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
  const {
    noDefaultInfinity = false,
    noNaN = false,
    min = noDefaultInfinity ? -MAX_VALUE_32 : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? MAX_VALUE_32 : Number.POSITIVE_INFINITY,
  } = constraints;
  const minIndex = safeFloatToIndex(min, 'min');
  const maxIndex = safeFloatToIndex(max, 'max');
  if (minIndex > maxIndex) {
    // Comparing min and max might be problematic in case min=+0 and max=-0
    // For that reason, we prefer to compare computed index to be safer
    throw new Error('fc.float constraints.min must be smaller or equal to constraints.max');
  }
  if (noNaN) {
    return integer({ min: minIndex, max: maxIndex }).map(indexToFloat);
  }
  // In case maxIndex > 0 or in other words max > 0,
  //   values will be [min, ..., +0, ..., max, NaN]
  //               or [min, ..., max, NaN] if min > +0
  // Otherwise,
  //   values will be [NaN, min, ..., max] with max <= +0
  const minIndexWithNaN = maxIndex > 0 ? minIndex : minIndex - 1;
  const maxIndexWithNaN = maxIndex > 0 ? maxIndex + 1 : maxIndex;
  return integer({ min: minIndexWithNaN, max: maxIndexWithNaN }).map((index) => {
    if (index > maxIndex || index < minIndex) return Number.NaN;
    else return indexToFloat(index);
  });
}
