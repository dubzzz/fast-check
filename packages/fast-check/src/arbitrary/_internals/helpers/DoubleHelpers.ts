import { BigInt, Number } from '../../../utils/globals';

const safeNegativeInfinity = Number.NEGATIVE_INFINITY;
const safePositiveInfinity = Number.POSITIVE_INFINITY;
const safeEpsilon = Number.EPSILON;

/** @internal */
const INDEX_POSITIVE_INFINITY = BigInt(2146435072) * BigInt(4294967296); // doubleToIndex(Number.MAX_VALUE) + 1;
/** @internal */
const INDEX_NEGATIVE_INFINITY = -INDEX_POSITIVE_INFINITY - BigInt(1); // doubleToIndex(-Number.MAX_VALUE) - 1

const num2Pow52 = 0x10000000000000; // Equivalent to 2 ** 52
const big2Pow52Mask = BigInt(0xfffffffffffff); // Equivalent to 2n ** 52n -1n
const big2Pow53 = BigInt('9007199254740992'); // Equivalent to 2n ** 53n = 9007199254740992n = 'Number.MAX_SAFE_INTEGER + 1'

const f64 = new Float64Array(1);
const u32 = new Uint32Array(f64.buffer, f64.byteOffset);
/** @internal */
function bitCastDoubleToUInt64(f: number): [number, number] {
  f64[0] = f;
  return [u32[1], u32[0]];
}

/**
 * Decompose a 64-bit floating point number into its interpreted parts:
 * - 53-bit significand (fraction) with implicit bit and sign included
 * - 11-bit exponent
 *
 * - Number.MAX_VALUE = 2**1023    * (1 + (2**52-1)/2**52)
 *                    = 2**1023    * (2 - Number.EPSILON)
 * - Number.MIN_VALUE = 2**(-1022) * 2**(-52)
 * - Number.EPSILON   = 2**(-52)
 *
 * @param d - 64-bit floating point number to be decomposed into (significand, exponent)
 *
 * @internal
 */
export function decomposeDouble(d: number): { exponent: number; significand: number } {
  const { 0: hi, 1: lo } = bitCastDoubleToUInt64(d);
  const signBit = hi >>> 31;
  const exponentBits = (hi >>> 20) & 0x7ff;
  const significandBits = (hi & 0xfffff) * 0x100000000 + lo;

  const exponent = exponentBits === 0 ? -1022 : exponentBits - 1023;
  let significand = exponentBits === 0 ? 0 : 1;
  significand += significandBits * safeEpsilon; // significand += significandBits / 2**52;
  significand *= signBit === 0 ? 1 : -1;

  return { exponent, significand };
}

/** @internal */
function indexInDoubleFromDecomp(exponent: number, significand: number): bigint {
  // WARNING: significand >= 0

  // By construct of significand in decomposeDouble,
  // significand is always max-ed.

  // The double close to zero are the only one having a significand <1, they also have an exponent of -1022.
  // They are in range: [2**(-1022) * 2**(-52), 2**(-1022) * (2 - 2 ** 52)]
  // In other words there are 2**53 elements in that range if we include zero.
  // All other ranges (other exponents) have a length of 2**52 elements.
  if (exponent === -1022) {
    // We want the significand to be an integer value (like an index)
    return BigInt(significand * num2Pow52); // significand * 2**52
  }
  // Offset due to exp = -1022 + Offset of previous exp (excl. -1022) + Offset in current exp
  // 2**53 + (exponent - (-1022) -1) * 2**52 + (significand - 1) * 2**52
  // (exponent + 1023) * 2**52 + (significand - 1) * 2**52
  const rescaledSignificand = BigInt((significand - 1) * num2Pow52); // (significand-1) * 2**52
  const exponentOnlyHigh = BigInt(exponent + 1023) << BigInt(52); // (exponent + 1023) * 2**52
  return rescaledSignificand + exponentOnlyHigh;
}

/**
 * Compute the index of d relative to other available 64-bit floating point numbers
 * Rq: Produces negative indexes for negative doubles
 *
 * @param d - 64-bit floating point number, anything except NaN
 *
 * @internal
 */
export function doubleToIndex(d: number): bigint {
  if (d === safePositiveInfinity) {
    return INDEX_POSITIVE_INFINITY;
  }
  if (d === safeNegativeInfinity) {
    return INDEX_NEGATIVE_INFINITY;
  }
  const decomp = decomposeDouble(d);
  const exponent = decomp.exponent;
  const significand = decomp.significand;
  if (d > 0 || (d === 0 && 1 / d === safePositiveInfinity)) {
    return indexInDoubleFromDecomp(exponent, significand);
  } else {
    return -indexInDoubleFromDecomp(exponent, -significand) - BigInt(1);
  }
}

/**
 * Compute the 64-bit floating point number corresponding to the provided indexes
 *
 * @param n - index of the double
 *
 * @internal
 */
export function indexToDouble(index: bigint): number {
  if (index < 0) {
    return -indexToDouble(-index - BigInt(1));
  }
  if (index === INDEX_POSITIVE_INFINITY) {
    return safePositiveInfinity;
  }
  if (index < big2Pow53) {
    // if: index < 2 ** 53
    // The first 2**53 elements correspond to values having
    // exponent = -1022 and significand = index * Number.EPSILON
    // double value = index * 2 ** -1022 * Number.EPSILON
    //              = index * 2 ** -1022 * 2 ** -52
    //              = index * 2 ** -1074
    return Number(index) * 2 ** -1074;
  }
  const postIndex = index - big2Pow53;
  // exponent = -1021 + Math.floor(postIndex / 2**52)
  //          = -1021 + (postIndex >> 52)
  const exponent = -1021 + Number(postIndex >> BigInt(52));
  // significand = 1 + (postIndex % 2**52) / 2**52
  //             = 1 + (postIndex % 2**52) * Number.EPSILON
  //             = 1 + (postIndex & (2**52 -1)) * Number.EPSILON
  const significand = 1 + Number(postIndex & big2Pow52Mask) * safeEpsilon;
  return significand * 2 ** exponent;
}
