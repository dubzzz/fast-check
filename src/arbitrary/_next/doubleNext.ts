import {
  add64,
  ArrayInt64,
  isEqual64,
  isStrictlyPositive64,
  isStrictlySmaller64,
  substract64,
  Unit64,
} from '../_internals/helpers/ArrayInt64';
import { arrayInt64 } from '../_internals/ArrayInt64Arbitrary';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { doubleToIndex, indexToDouble } from '../_internals/helpers/DoubleHelpers';
import { convertFromNext, convertToNext } from '../../check/arbitrary/definition/Converters';

/**
 * Constraints to be applied on {@link doubleNext}
 * @remarks Since 2.8.1
 * @public
 */
export interface DoubleNextConstraints {
  /**
   * Lower bound for the generated 64-bit floats (included)
   * @defaultValue Number.NEGATIVE_INFINITY, -1.7976931348623157e+308 when noDefaultInfinity is true
   * @remarks Since 2.8.0
   */
  min?: number;
  /**
   * Upper bound for the generated 64-bit floats (included)
   * @defaultValue Number.POSITIVE_INFINITY, 1.7976931348623157e+308 when noDefaultInfinity is true
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
  if (isStrictlySmaller64(maxIndex, minIndex)) {
    // In other words: minIndex > maxIndex
    // Comparing min and max might be problematic in case min=+0 and max=-0
    // For that reason, we prefer to compare computed index to be safer
    throw new Error('fc.doubleNext constraints.min must be smaller or equal to constraints.max');
  }
  if (noNaN) {
    return convertFromNext(convertToNext(arrayInt64(minIndex, maxIndex)).map(indexToDouble, unmapperDoubleToIndex));
  }
  // In case maxIndex > 0 or in other words max > 0,
  //   values will be [min, ..., +0, ..., max, NaN]
  //               or [min, ..., max, NaN] if min > +0
  // Otherwise,
  //   values will be [NaN, min, ..., max] with max <= +0
  const positiveMaxIdx = isStrictlyPositive64(maxIndex);
  const minIndexWithNaN = positiveMaxIdx ? minIndex : substract64(minIndex, Unit64);
  const maxIndexWithNaN = positiveMaxIdx ? add64(maxIndex, Unit64) : maxIndex;
  return convertFromNext(
    convertToNext(arrayInt64(minIndexWithNaN, maxIndexWithNaN)).map(
      (index) => {
        if (isStrictlySmaller64(maxIndex, index) || isStrictlySmaller64(index, minIndex)) return Number.NaN;
        else return indexToDouble(index);
      },
      (value) => {
        if (typeof value !== 'number') throw new Error('Unsupported type');
        if (Number.isNaN(value)) return !isEqual64(maxIndex, maxIndexWithNaN) ? maxIndexWithNaN : minIndexWithNaN;
        return doubleToIndex(value);
      }
    )
  );
}
