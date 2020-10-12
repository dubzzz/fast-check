import { Arbitrary } from './definition/Arbitrary';
import { integer } from './IntegerArbitrary';

/** @internal */
export const MIN_VALUE_32 = 2 ** -126 * 2 ** -23;
/** @internal */
export const MAX_VALUE_32 = 2 ** 127 * (1 + (2 ** 23 - 1) / 2 ** 23);
/** @internal */
export const EPSILON_32 = 2 ** -23;

/**
 * Decompose a 32-bit floating point number into a significand and exponent
 * such as:
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
 * Constraints to be applied on {@link floatNext}
 * @public
 */
export interface FloatNextConstraints {
  /**
   * Lower bound for the generated 32-bit floats (included)
   * @defaultValue -3.4028234663852886e+38
   */
  min?: number;
  /**
   * Upper bound for the generated 32-bit floats (included)
   * @defaultValue 3.4028234663852886e+38
   */
  max?: number;
}

/**
 * Same as {@link floatToIndex} except it throws in case of invalid float 32
 *
 * @internal
 */
function safeFloatToIndex(f: number, constraintsLabel: keyof FloatNextConstraints) {
  const index = floatToIndex(f);
  if (Number.isNaN(index) || !Number.isInteger(index) || f < -MAX_VALUE_32 || f > MAX_VALUE_32) {
    const conversionTrick = 'you can convert any double to a 32-bit float by using `new Float32Array([myDouble])[0]`';
    throw new Error('fc.floatNext constraints.' + constraintsLabel + ' must be a 32-bit float - ' + conversionTrick);
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
 * @param constraints - Constraints to apply when building instances
 *
 * @public
 */
export function floatNext(constraints: FloatNextConstraints = {}): Arbitrary<number> {
  const { min = -MAX_VALUE_32, max = MAX_VALUE_32 } = constraints;
  const minIndex = safeFloatToIndex(min, 'min');
  const maxIndex = safeFloatToIndex(max, 'max');
  if (minIndex > maxIndex) {
    throw new Error('fc.floatNext constraints.min must be smaller or equal to constraints.max');
  }
  return integer(minIndex, maxIndex).map(indexToFloat);
}
