import { integer } from '../integer';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { floatToIndex, indexToFloat, MAX_VALUE_32 } from '../_internals/helpers/FloatHelpers';

/**
 * Constraints to be applied on {@link floatNext}
 * @remarks Since 2.8.0
 * @public
 */
export interface FloatNextConstraints {
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
function safeFloatToIndex(f: number, constraintsLabel: keyof FloatNextConstraints) {
  const conversionTrick = 'you can convert any double to a 32-bit float by using `new Float32Array([myDouble])[0]`';
  const errorMessage = 'fc.floatNext constraints.' + constraintsLabel + ' must be a 32-bit float - ' + conversionTrick;
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
 * @param constraints - Constraints to apply when building instances
 *
 * @public
 */
export function floatNext(constraints: FloatNextConstraints = {}): Arbitrary<number> {
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
    throw new Error('fc.floatNext constraints.min must be smaller or equal to constraints.max');
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
