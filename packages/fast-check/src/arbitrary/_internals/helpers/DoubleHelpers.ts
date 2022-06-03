import { ArrayInt64, clone64, isEqual64 } from './ArrayInt64';

/** @internal */
const INDEX_POSITIVE_INFINITY: ArrayInt64 = { sign: 1, data: [2146435072, 0] }; // doubleToIndex(Number.MAX_VALUE) + 1;
/** @internal */
const INDEX_NEGATIVE_INFINITY: ArrayInt64 = { sign: -1, data: [2146435072, 1] }; // doubleToIndex(-Number.MAX_VALUE) - 1

/**
 * Decompose a 64-bit floating point number into a significand and exponent
 * such that:
 * - significand over 53 bits including sign (also referred as fraction)
 * - exponent over 11 bits including sign
 * - whenever there are multiple possibilities we take the one having the highest significand (in abs)
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
  // 1 => significand 0b1   - exponent 1 (will be preferred)
  //   => significand 0b0.1 - exponent 2
  const maxSignificand = 2 - Number.EPSILON;
  for (let exponent = -1022; exponent !== 1024; ++exponent) {
    const powExponent = 2 ** exponent;
    const maxForExponent = maxSignificand * powExponent;
    if (Math.abs(d) <= maxForExponent) {
      return { exponent, significand: d / powExponent };
    }
  }
  return { exponent: Number.NaN, significand: Number.NaN };
}

/** @internal */
function positiveNumberToInt64(n: number): ArrayInt64['data'] {
  return [~~(n / 0x100000000), n >>> 0];
}

/** @internal */
function indexInDoubleFromDecomp(exponent: number, significand: number): ArrayInt64['data'] {
  // WARNING: significand >= 0

  // By construct of significand in decomposeDouble,
  // significand is always max-ed.

  // The double close to zero are the only one having a significand <1, they also have an exponent of -1022.
  // They are in range: [2**(-1022) * 2**(-52), 2**(-1022) * (2 - 2 ** 52)]
  // In other words there are 2**53 elements in that range if we include zero.
  // All other ranges (other exponents) have a length of 2**52 elements.
  if (exponent === -1022) {
    // We want the significand to be an integer value (like an index)
    const rescaledSignificand = significand * 2 ** 52; // significand * 2**52
    return positiveNumberToInt64(rescaledSignificand);
  }
  // Offset due to exp = -1022 + Offset of previous exp (excl. -1022) + Offset in current exp
  // 2**53 + (exponent - (-1022) -1) * 2**52 + (significand - 1) * 2**52
  // (exponent + 1023) * 2**52 + (significand - 1) * 2**52
  const rescaledSignificand = (significand - 1) * 2 ** 52; // (significand-1) * 2**52
  const exponentOnlyHigh = (exponent + 1023) * 2 ** 20; // (exponent + 1023) * 2**52 => [high: (exponent + 1023) * 2**20, low: 0]
  const index = positiveNumberToInt64(rescaledSignificand);
  index[0] += exponentOnlyHigh;
  return index;
}

/**
 * Compute the index of d relative to other available 64-bit floating point numbers
 * Rq: Produces negative indexes for negative doubles
 *
 * @param d - 64-bit floating point number, anything except NaN
 *
 * @internal
 */
export function doubleToIndex(d: number): ArrayInt64 {
  if (d === Number.POSITIVE_INFINITY) {
    return clone64(INDEX_POSITIVE_INFINITY);
  }
  if (d === Number.NEGATIVE_INFINITY) {
    return clone64(INDEX_NEGATIVE_INFINITY);
  }
  const decomp = decomposeDouble(d);
  const exponent = decomp.exponent;
  const significand = decomp.significand;
  if (d > 0 || (d === 0 && 1 / d === Number.POSITIVE_INFINITY)) {
    return { sign: 1, data: indexInDoubleFromDecomp(exponent, significand) };
  } else {
    const indexOpposite = indexInDoubleFromDecomp(exponent, -significand);
    if (indexOpposite[1] === 0xffffffff) {
      indexOpposite[0] += 1;
      indexOpposite[1] = 0;
    } else {
      indexOpposite[1] += 1;
    }
    return { sign: -1, data: indexOpposite }; // -indexInDoubleFromDecomp(exponent, -significand) - 1
  }
}

/**
 * Compute the 64-bit floating point number corresponding to the provided indexes
 *
 * @param n - index of the double
 *
 * @internal
 */
export function indexToDouble(index: ArrayInt64): number {
  if (index.sign === -1) {
    const indexOpposite: ArrayInt64 = { sign: 1, data: [index.data[0], index.data[1]] };
    if (indexOpposite.data[1] === 0) {
      indexOpposite.data[0] -= 1;
      indexOpposite.data[1] = 0xffffffff;
    } else {
      indexOpposite.data[1] -= 1;
    }
    return -indexToDouble(indexOpposite); // -indexToDouble(-index - 1);
  }
  if (isEqual64(index, INDEX_POSITIVE_INFINITY)) {
    return Number.POSITIVE_INFINITY;
  }
  if (index.data[0] < 0x200000) {
    // if: index < 2 ** 53  <--> index[0] < 2 ** (53-32) = 0x20_0000
    // The first 2**53 elements correspond to values having
    // exponent = -1022 and significand = index * Number.EPSILON
    // double value = index * 2 ** -1022 * Number.EPSILON
    //              = index * 2 ** -1022 * 2 ** -52
    //              = index * 2 ** -1074
    return (index.data[0] * 0x100000000 + index.data[1]) * 2 ** -1074;
  }
  const postIndexHigh = index.data[0] - 0x200000; // postIndex = index - 2 ** 53
  // exponent = -1021 + Math.floor(postIndex / 2**52)
  //          = -1021 + Math.floor(postIndexHigh / 2**(52-32))
  //          = -1021 + Math.floor(postIndexHigh / 2**20)
  //          = -1021 + (postIndexHigh >> 20)
  const exponent = -1021 + (postIndexHigh >> 20);
  // significand = 1 + (postIndex % 2**52) / 2**52
  //             = 1 + ((postIndexHigh * 2**32 + postIndexLow) % 2**52) / 2**52
  //             = 1 + ((postIndexHigh % 2**20) * 2**32 + postIndexLow) / 2**52
  //             = 1 + ((postIndexHigh & 0xfffff) * 2**32 + postIndexLow) / 2**52
  //             = 1 + ((postIndexHigh & 0xfffff) * 2**32 + postIndexLow) * Number.EPSILON
  const significand = 1 + ((postIndexHigh & 0xfffff) * 2 ** 32 + index.data[1]) * Number.EPSILON;
  return significand * 2 ** exponent;
}
