import type { ArrayInt64 } from './_internals/helpers/ArrayInt64';
import {
  add64,
  isEqual64,
  isStrictlyPositive64,
  isStrictlySmaller64,
  substract64,
  Unit64,
} from './_internals/helpers/ArrayInt64';
import { arrayInt64 } from './_internals/ArrayInt64Arbitrary';
import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { doubleToIndex, indexToDouble } from './_internals/helpers/DoubleHelpers';

const safeNumberIsNaN = Number.isNaN;

const safeNegativeInfinity = Number.NEGATIVE_INFINITY;
const safePositiveInfinity = Number.POSITIVE_INFINITY;
const safeMaxValue = Number.MAX_VALUE;
const safeNaN = Number.NaN;

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
}

/**
 * Same as {@link doubleToIndex} except it throws in case of invalid double (NaN)
 *
 * @internal
 */
function safeDoubleToIndex(d: number, constraintsLabel: keyof DoubleConstraints) {
  if (safeNumberIsNaN(d)) {
    // Number.NaN does not have any associated index in the current implementation
    throw new Error('fc.double constraints.' + constraintsLabel + ' must be a 64-bit float');
  }
  return doubleToIndex(d);
}

/** @internal */
function unmapperDoubleToIndex(value: unknown): ArrayInt64 {
  if (typeof value !== 'number') throw new Error('Unsupported type');
  return doubleToIndex(value);
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
  const {
    noDefaultInfinity = false,
    noNaN = false,
    minExcluded = false,
    maxExcluded = false,
    min = noDefaultInfinity ? -safeMaxValue : safeNegativeInfinity,
    max = noDefaultInfinity ? safeMaxValue : safePositiveInfinity,
  } = constraints;
  const minIndexRaw = safeDoubleToIndex(min, 'min');
  const minIndex = minExcluded ? add64(minIndexRaw, Unit64) : minIndexRaw;
  const maxIndexRaw = safeDoubleToIndex(max, 'max');
  const maxIndex = maxExcluded ? substract64(maxIndexRaw, Unit64) : maxIndexRaw;
  if (isStrictlySmaller64(maxIndex, minIndex)) {
    // In other words: minIndex > maxIndex
    // Comparing min and max might be problematic in case min=+0 and max=-0
    // For that reason, we prefer to compare computed index to be safer
    throw new Error('fc.double constraints.min must be smaller or equal to constraints.max');
  }
  if (noNaN) {
    return arrayInt64(minIndex, maxIndex).map(indexToDouble, unmapperDoubleToIndex);
  }
  // In case maxIndex > 0 or in other words max > 0,
  //   values will be [min, ..., +0, ..., max, NaN]
  //               or [min, ..., max, NaN] if min > +0
  // Otherwise,
  //   values will be [NaN, min, ..., max] with max <= +0
  const positiveMaxIdx = isStrictlyPositive64(maxIndex);
  const minIndexWithNaN = positiveMaxIdx ? minIndex : substract64(minIndex, Unit64);
  const maxIndexWithNaN = positiveMaxIdx ? add64(maxIndex, Unit64) : maxIndex;
  return arrayInt64(minIndexWithNaN, maxIndexWithNaN).map(
    (index) => {
      if (isStrictlySmaller64(maxIndex, index) || isStrictlySmaller64(index, minIndex)) return safeNaN;
      else return indexToDouble(index);
    },
    (value) => {
      if (typeof value !== 'number') throw new Error('Unsupported type');
      if (safeNumberIsNaN(value)) return !isEqual64(maxIndex, maxIndexWithNaN) ? maxIndexWithNaN : minIndexWithNaN;
      return doubleToIndex(value);
    },
  );
}
