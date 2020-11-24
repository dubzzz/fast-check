import { Random } from '../../random/generator/Random';
import { stream, Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { ArbitraryWithShrink } from './definition/ArbitraryWithShrink';
import { biasWrapper } from './definition/BiasedArbitraryWrapper';
import { Shrinkable } from './definition/Shrinkable';
import { BiasedNumericArbitrary } from './helpers/BiasNumeric';
//import { integer } from './IntegerArbitrary';

/** @internal */
type Int64 = [number, number];
/** @internal */
type ArrayInt64 = { sign: 1 | -1; data: Int64 };

/** @internal */
const INDEX_POSITIVE_INFINITY: ArrayInt64 = { sign: 1, data: [2146435072, 0] }; // doubleToIndex(Number.MAX_VALUE) + 1;
/** @internal */
const INDEX_NEGATIVE_INFINITY: ArrayInt64 = { sign: -1, data: [2146435072, 1] }; // doubleToIndex(-Number.MAX_VALUE) - 1

/**
 * Decompose a 64-bit floating point number into a significand and exponent
 * such as:
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
function positiveNumberToInt64(n: number): Int64 {
  return [~~(n / 0x100000000), n >>> 0];
}

/** @internal */
function indexInDoubleFromDecomp(exponent: number, significand: number): Int64 {
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
    return { sign: INDEX_POSITIVE_INFINITY.sign, data: INDEX_POSITIVE_INFINITY.data.slice() as Int64 };
  }
  if (d === Number.NEGATIVE_INFINITY) {
    return { sign: INDEX_NEGATIVE_INFINITY.sign, data: INDEX_NEGATIVE_INFINITY.data.slice() as Int64 };
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
  if (index.data[0] === INDEX_POSITIVE_INFINITY.data[0] && index.data[1] === INDEX_POSITIVE_INFINITY.data[1]) {
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

/** @internal */
function isZero(a: ArrayInt64) {
  return a.data[0] === 0 && a.data[1] === 0;
}

/** @internal */
function isStrictlySmaller(a: ArrayInt64, b: ArrayInt64) {
  if (a.sign === b.sign) {
    if (a.sign === 1) {
      // a.sign = +1, b.sign = +1
      return a.data[0] < b.data[0] || (a.data[0] === b.data[0] && a.data[1] < b.data[1]);
    }
    // a.sign = -1, b.sign = -1
    return b.data[0] < a.data[0] || (b.data[0] === a.data[0] && b.data[1] < a.data[1]);
  }
  if (a.sign === 1) {
    // a.sign = +1, b.sign = -1
    return false;
  }
  // a.sign = -1, b.sign = +1
  return !isZero(a) || !isZero(b);
}

/**
 * Substract two ArrayInt of 64 bits on 64 bits
 * arrayIntA - arrayIntB >= 0
 * @internal
 */
function substractArrayInt64Internal(arrayIntA: ArrayInt64, arrayIntB: ArrayInt64): ArrayInt64 {
  const lowA = arrayIntA.data[1];
  const highA = arrayIntA.data[0];
  const signA = arrayIntA.sign;
  const lowB = arrayIntB.data[1];
  const highB = arrayIntB.data[0];
  const signB = arrayIntB.sign;

  if (signA === 1 && signB === -1) {
    // Operation is a simple sum of arrayIntA + abs(arrayIntB)
    const low = lowA + lowB;
    const high = highA + highB + (low > 0xffffffff ? 1 : 0);
    return { sign: 1, data: [high >>> 0, low >>> 0] };
  }

  // signA === -1 with signB === 1 is impossible given: arrayIntA - arrayIntB >= 0
  // Operation is a substraction
  let lowFirst = lowA;
  let highFirst = highA;
  let lowSecond = lowB;
  let highSecond = highB;
  if (signA === -1) {
    lowFirst = lowB;
    highFirst = highB;
    lowSecond = lowA;
    highSecond = highA;
  }
  let reminderLow = 0;
  let low = lowFirst - lowSecond;
  if (low < 0) {
    reminderLow = 1;
    low = low >>> 0;
  }
  return { sign: 1, data: [highFirst - highSecond - reminderLow, low] };
}

/**
 * Substract two ArrayInt of 64 bits on 64 bits
 * sign will be -1 only for <0 values
 * @internal
 */
function substractArrayInt64(arrayIntA: ArrayInt64, arrayIntB: ArrayInt64): ArrayInt64 {
  if (isStrictlySmaller(arrayIntA, arrayIntB)) {
    const out = substractArrayInt64Internal(arrayIntB, arrayIntA);
    out.sign = -1;
    return out;
  }
  return substractArrayInt64Internal(arrayIntA, arrayIntB);
}

/**
 * Negative
 * @internal
 */
function negativeArrayInt64(arrayIntA: ArrayInt64): ArrayInt64 {
  return {
    sign: -arrayIntA.sign as -1 | 1,
    data: [arrayIntA.data[0], arrayIntA.data[1]],
  };
}

/**
 * Add two ArrayInt of 64 bits on 64 bits
 * @internal
 */
function addArrayInt64(arrayIntA: ArrayInt64, arrayIntB: ArrayInt64): ArrayInt64 {
  if (isZero(arrayIntB)) {
    return { sign: arrayIntA.sign, data: [arrayIntA.data[0], arrayIntA.data[1]] };
  }
  return substractArrayInt64(arrayIntA, negativeArrayInt64(arrayIntB));
}

/** @internal */
function halve(a: ArrayInt64): ArrayInt64 {
  return {
    sign: a.sign,
    data: [Math.floor(a.data[0] / 2), (a.data[0] % 2 === 1 ? 0x80000000 : 0) + Math.floor(a.data[1] / 2)],
  };
}

/** @internal */
function logLike(a: ArrayInt64): ArrayInt64 {
  // Math.floor(Math.log(hi * 2**32 + low) / Math.log(2)) <= Math.floor(Math.log(2**64) / Math.log(2)) = 64
  return {
    sign: a.sign,
    data: [0, Math.floor(Math.log(a.data[1] * 0x100000000 + a.data[0]) / Math.log(2))],
  };
}

/** @internal */
class ArrayInt64Arbitrary extends ArbitraryWithShrink<ArrayInt64> {
  private biasedArrayInt64Arbitrary: Arbitrary<ArrayInt64> | null = null;
  constructor(
    readonly min: ArrayInt64,
    readonly max: ArrayInt64,
    readonly genMin: ArrayInt64,
    readonly genMax: ArrayInt64
  ) {
    super();
  }
  private wrapper(value: ArrayInt64, shrunkOnce: boolean): Shrinkable<ArrayInt64> {
    return new Shrinkable(value, () => this.shrink(value, shrunkOnce).map((v) => this.wrapper(v, true)));
  }
  generate(mrng: Random): Shrinkable<ArrayInt64> {
    const uncheckedValue = mrng.nextArrayInt(this.genMin, this.genMax);
    if (uncheckedValue.data.length === 1) {
      // either 1 or 2, never 0 or >2
      uncheckedValue.data.unshift(0); // prepend a zero
    }
    return this.wrapper(uncheckedValue as ArrayInt64, false);
  }
  private shrinkValueTowards(value: ArrayInt64, target: ArrayInt64, shrunkOnce?: boolean): Stream<ArrayInt64> {
    const realGap = substractArrayInt64(value, target);
    function* shrinkGen(): IterableIterator<ArrayInt64> {
      const gap = shrunkOnce ? halve(realGap) : realGap;
      for (let toremove = gap; !isZero(toremove); toremove = halve(toremove)) {
        yield substractArrayInt64(value, toremove);
      }
    }
    return stream(shrinkGen());
  }
  shrink(value: ArrayInt64, shrunkOnce?: boolean): Stream<ArrayInt64> {
    // min <= 0 && max >= 0
    // => shrink towards zero
    if ((this.min.sign === -1 || isZero(this.min)) && (this.max.sign === 1 || isZero(this.max))) {
      return this.shrinkValueTowards(value, { sign: 1, data: [0, 0] }, shrunkOnce);
    }
    // value < 0
    // => shrink towards max (closer to zero)
    if (value.sign === -1 && !isZero(value)) {
      return this.shrinkValueTowards(value, this.max, shrunkOnce);
    }
    // => shrink towards min (closer to zero)
    return this.shrinkValueTowards(value, this.min, shrunkOnce);
  }
  private pureBiasedArbitrary(): Arbitrary<ArrayInt64> {
    if (this.biasedArrayInt64Arbitrary != null) {
      return this.biasedArrayInt64Arbitrary;
    }
    if (
      this.min.sign === this.max.sign &&
      this.min.data[0] === this.max.data[0] &&
      this.min.data[1] === this.max.data[1]
    ) {
      this.biasedArrayInt64Arbitrary = this;
      return this;
    }
    if (isZero(this.min) && isZero(this.max)) {
      this.biasedArrayInt64Arbitrary = this;
      return this;
    }
    const minStrictlySmallerZero = this.min.sign === -1 && (this.min.data[0] !== 0 || this.min.data[1] !== 0);
    const maxStrictlyGreaterZero = this.max.sign === +1 && (this.max.data[0] !== 0 || this.max.data[1] !== 0);
    if (minStrictlySmallerZero && maxStrictlyGreaterZero) {
      // min < 0 && max > 0
      const logMin = logLike(this.min); // min !== 0
      const logMax = logLike(this.max); // max !== 0
      this.biasedArrayInt64Arbitrary = new BiasedNumericArbitrary(
        new ArrayInt64Arbitrary(this.min, this.max, negativeArrayInt64(logMin), logMax), // close to zero,
        new ArrayInt64Arbitrary(this.min, this.max, substractArrayInt64(this.max, logMax), this.max), // close to max
        new ArrayInt64Arbitrary(this.min, this.max, this.min, addArrayInt64(this.min, logMin)) // close to min
      );
    } else {
      // Either min < 0 && max <= 0
      // Or min >= 0, so max >= 0
      const logGap = logLike(substractArrayInt64(this.max, this.min)); // max-min !== 0
      const arbCloseToMin = new ArrayInt64Arbitrary(this.min, this.max, this.min, addArrayInt64(this.min, logGap)); // close to min
      const arbCloseToMax = new ArrayInt64Arbitrary(
        this.min,
        this.max,
        substractArrayInt64(this.max, logGap),
        this.max
      ); // close to max
      return minStrictlySmallerZero
        ? new BiasedNumericArbitrary(arbCloseToMax, arbCloseToMin) // max is closer to zero
        : new BiasedNumericArbitrary(arbCloseToMin, arbCloseToMax); // min is closer to zero
    }
    return this.biasedArrayInt64Arbitrary;
  }
  withBias(freq: number): Arbitrary<ArrayInt64> {
    return biasWrapper(freq, this, (originalArbitrary: ArrayInt64Arbitrary) => originalArbitrary.pureBiasedArbitrary());
  }
}

/**
 * Constraints to be applied on {@link doubleNext}
 * @public
 */
export interface DoubleNextConstraints {
  /**
   * Lower bound for the generated 64-bit floats (included)
   * @defaultValue Number.NEGATIVE_INFINITY, -1.7976931348623157e+308 when noDefaultInfinity is true
   */
  min?: number;
  /**
   * Upper bound for the generated 64-bit floats (included)
   * @defaultValue Number.POSITIVE_INFINITY, 1.7976931348623157e+308 when noDefaultInfinity is true
   */
  max?: number;
  /**
   * By default, lower and upper bounds are -infinity and +infinity.
   * By setting noDefaultInfinity to true, you move those defaults to minimal and maximal finite values.
   * @defaultValue false
   */
  noDefaultInfinity?: boolean;
  /**
   * When set to true, no more Number.NaN can be generated.
   * @defaultValue false
   */
  noNaN?: boolean;
}

/**
 * Same as {@link doubleToIndex} except it throws in case of invalid double
 *
 * @internal
 */
function safeDoubleToIndex(d: number, constraintsLabel: keyof DoubleNextConstraints) {
  if (Number.isNaN(d)) {
    // Number.NaN does not have any associated index in the current implementation
    throw new Error('fc.doubleNext constraints.' + constraintsLabel + ' must be a 32-bit float');
  }
  return doubleToIndex(d);
}

/**
 * For 64-bit floating point numbers:
 * - sign: 1 bit
 * - significand: 52 bits
 * - exponent: 11 bits
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @public
 */
export function doubleNext(constraints: DoubleNextConstraints = {}): Arbitrary<number> {
  const {
    noDefaultInfinity = false,
    noNaN = false,
    min = noDefaultInfinity ? -Number.MAX_VALUE : Number.NEGATIVE_INFINITY,
    max = noDefaultInfinity ? Number.MAX_VALUE : Number.POSITIVE_INFINITY,
  } = constraints;
  const minIndex = safeDoubleToIndex(min, 'min');
  const maxIndex = safeDoubleToIndex(max, 'max');
  if (minIndex > maxIndex) {
    // Comparing min and max might be problematic in case min=+0 and max=-0
    // For that reason, we prefer to compare computed index to be safer
    throw new Error('fc.doubleNext constraints.min must be smaller or equal to constraints.max');
  }
  if (noNaN) {
    const arb = new ArrayInt64Arbitrary(minIndex, maxIndex, minIndex, maxIndex);
    return arb.map(indexToDouble);
  }
  // In case maxIndex > 0 or in other words max > 0,
  //   values will be [min, ..., +0, ..., max, NaN]
  //               or [min, ..., max, NaN] if min > +0
  // Otherwise,
  //   values will be [NaN, min, ..., max] with max <= +0
  const isStPosMaxIndex = maxIndex.sign === 1 && !isZero(maxIndex);
  const minIndexWithNaN = isStPosMaxIndex ? minIndex : substractArrayInt64(minIndex, { sign: 1, data: [0, 1] });
  const maxIndexWithNaN = isStPosMaxIndex ? addArrayInt64(minIndex, { sign: 1, data: [0, 1] }) : maxIndex;
  const arb = new ArrayInt64Arbitrary(minIndexWithNaN, maxIndexWithNaN, minIndexWithNaN, maxIndexWithNaN);
  return arb.map((index) => {
    if (isStrictlySmaller(maxIndex, index) || isStrictlySmaller(index, minIndex)) return Number.NaN;
    else return indexToDouble(index);
  });
}
