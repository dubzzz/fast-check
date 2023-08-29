const safeNegativeInfinity = Number.NEGATIVE_INFINITY;
const safePositiveInfinity = Number.POSITIVE_INFINITY;

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

const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer, f32.byteOffset);
/** @internal */
function bitCastFloatToUInt32(f: number): number {
  f32[0] = f;
  return u32[0];
}

/**
 * Decompose a 32-bit floating point number into its interpreted parts:
 * - 24-bit significand (fraction) with implicit bit included
 * - 8-bit signed exponent after bias subtraction
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
  const bits = bitCastFloatToUInt32(f);
  const signBit = bits >>> 31;
  const exponentBits = (bits >>> 23) & 0xff;
  const significandBits = bits & 0x7fffff;

  const exponent = exponentBits === 0 ? -126 : exponentBits - 127;
  let significand = exponentBits === 0 ? 0 : 1;
  significand += significandBits / 2 ** 23;
  significand *= signBit === 0 ? 1 : -1;

  return { exponent, significand };
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
  if (f === safePositiveInfinity) {
    return INDEX_POSITIVE_INFINITY;
  }
  if (f === safeNegativeInfinity) {
    return INDEX_NEGATIVE_INFINITY;
  }
  const decomp = decomposeFloat(f);
  const exponent = decomp.exponent;
  const significand = decomp.significand;
  if (f > 0 || (f === 0 && 1 / f === safePositiveInfinity)) {
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
    return safePositiveInfinity;
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
