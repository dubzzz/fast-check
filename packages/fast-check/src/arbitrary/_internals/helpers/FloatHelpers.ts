const safeNegativeInfinity = Number.NEGATIVE_INFINITY;
const safePositiveInfinity = Number.POSITIVE_INFINITY;
const safeMathImul = Math.imul;

/** @internal */
export const MIN_VALUE_32: number = 2 ** -126 * 2 ** -23;
/** @internal */
export const MAX_VALUE_32: number = 2 ** 127 * (1 + (2 ** 23 - 1) / 2 ** 23);
/** @internal */
export const EPSILON_32: number = 2 ** -23;

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
/** @internal */
function bitCastUInt32ToFloat(n: number): number {
  u32[0] = n;
  return f32[0];
}

/**
 * 32-bit floating point NaN bit patterns that fast-check is able to produce.
 *
 * All the values below are indistinguishable from each other -and from any other NaN- as soon as they
 * hit the language level: `Number.isNaN`, `===`, `Object.is`... never let any difference show up.
 * The only way to observe the difference is to look at their raw bits, for instance by copying the value
 * into a `Float32Array` and reading it back as a `Uint32Array` (see #6532).
 *
 * NAN_32_BIT_PATTERNS[0] is the canonical one: it is the pattern used whenever JavaScript itself has to
 * produce a NaN (for instance as the result of `0/0`, or as `Number.NaN`).
 *
 * @internal
 */
export const NAN_32_BIT_PATTERNS: readonly number[] = [
  0x7fc00000, // Canonical quiet NaN (positive)
  0x7f800001, // Signaling NaN (positive, smallest payload)
  0x7fffffff, // Quiet NaN with all mantissa bits set
  0xffc00000, // Quiet NaN (negative)
  0xff800001, // Signaling NaN (negative, smallest payload)
];

/**
 * 32-bit floating point NaN values that fast-check is able to produce, derived from {@link NAN_32_BIT_PATTERNS}.
 * NAN_32_VALUES[0] is the canonical one.
 *
 * @internal
 */
export const NAN_32_VALUES: readonly number[] = NAN_32_BIT_PATTERNS.map(bitCastUInt32ToFloat);

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
  return safeMathImul(exponent + 127, 0x800000) + (significand - 1) * 0x800000;
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
