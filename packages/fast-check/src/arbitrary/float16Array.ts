import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { Uint16Array as SUint16Array } from '../utils/globals.js';
import { array } from './array.js';
import { integer } from './integer.js';
import type { Float32ArrayConstraints } from './float32Array.js';
import { refineConstraintsForFloatingOnly } from './_internals/helpers/FloatingOnlyHelpers.js';

const SFloat16Array = typeof Float16Array === 'undefined' ? undefined : Float16Array;
const safeNumberIsNaN = Number.isNaN;
const safeNumberIsInteger = Number.isInteger;
const safeObjectIs = Object.is;
const safeNegativeInfinity = Number.NEGATIVE_INFINITY;
const safePositiveInfinity = Number.POSITIVE_INFINITY;
const safeNaN = Number.NaN;

/**
 * Constraints to be applied on {@link float16Array}
 * @remarks Since 4.10.0
 * @public
 */
export type Float16ArrayConstraints = Omit<Float32ArrayConstraints, 'min' | 'max'> & {
  /**
   * Lower bound for the generated 16-bit floats (included)
   * @defaultValue Number.NEGATIVE_INFINITY, -65504 when noDefaultInfinity is true
   * @remarks Since 4.10.0
   */
  min?: number;
  /**
   * Upper bound for the generated 16-bit floats (included)
   * @defaultValue Number.POSITIVE_INFINITY, 65504 when noDefaultInfinity is true
   * @remarks Since 4.10.0
   */
  max?: number;
};

/**
 * For Float16Array. Requires an environment with Float16Array support.
 *
 * Values use binary16 precision, including signed zeros, infinities and NaN.
 * Bounds must be exactly representable as 16-bit floats.
 * The value type is unknown when TypeScript has no global Float16Array constructor declaration.
 *
 * @remarks Since 4.10.0
 * @public
 */
export function float16Array(
  constraints: Float16ArrayConstraints = {},
): Arbitrary<typeof globalThis extends { Float16Array: { from: (...args: any[]) => infer T } } ? T : unknown> {
  if (SFloat16Array === undefined) {
    throw new Error('fc.float16Array requires Float16Array support');
  }
  const Float16ArrayClass = SFloat16Array;
  const f16 = new Float16ArrayClass(1);
  const u16 = new SUint16Array(f16.buffer);

  function floatToIndex(value: number): number {
    f16[0] = value;
    return u16[0] < 0x8000 ? u16[0] : -(u16[0] & 0x7fff) - 1;
  }
  function indexToFloat(index: number): number {
    u16[0] = index < 0 ? 0x8000 + (-index - 1) : index;
    return f16[0];
  }
  function safeFloatToIndex(value: number, label: 'min' | 'max'): number {
    const index = floatToIndex(value);
    if (safeNumberIsNaN(value) || !safeObjectIs(f16[0], value)) {
      throw new Error(`fc.float16Array constraints.${label} must be a 16-bit float`);
    }
    return index;
  }

  // Validate the original bounds before noInteger refines them.
  const {
    min: originalMin = constraints.noDefaultInfinity ? -65504 : safeNegativeInfinity,
    max: originalMax = constraints.noDefaultInfinity ? 65504 : safePositiveInfinity,
  } = constraints;
  const originalMinIndex = safeFloatToIndex(originalMin, 'min') + (constraints.minExcluded ? 1 : 0);
  const originalMaxIndex = safeFloatToIndex(originalMax, 'max') - (constraints.maxExcluded ? 1 : 0);
  if (originalMinIndex > originalMaxIndex) {
    throw new Error('fc.float16Array constraints.min must be smaller or equal to constraints.max');
  }
  if (constraints.noInteger && (originalMinIndex >= floatToIndex(1024) || originalMaxIndex <= floatToIndex(-1024))) {
    // Beyond the fractional range, an included infinity is the only possible
    // non-integer value. Preserve it instead of clamping past the other bound.
    const infinity = originalMinIndex >= floatToIndex(1024) ? safePositiveInfinity : safeNegativeInfinity;
    const infinityIndex = floatToIndex(infinity);
    if (infinityIndex >= originalMinIndex && infinityIndex <= originalMaxIndex) {
      return float16Array({
        ...constraints,
        min: infinity,
        max: infinity,
        minExcluded: false,
        maxExcluded: false,
        noInteger: false,
      });
    }
    throw new Error('fc.float16Array constraints.min must be smaller or equal to constraints.max');
  }
  const {
    noDefaultInfinity = false,
    noNaN = false,
    minExcluded = false,
    maxExcluded = false,
    min = noDefaultInfinity ? -65504 : safeNegativeInfinity,
    max = noDefaultInfinity ? 65504 : safePositiveInfinity,
  } = constraints.noInteger ? refineConstraintsForFloatingOnly(constraints, 65504, 1023.5, 1024) : constraints;
  const minIndex = safeFloatToIndex(min, 'min') + (minExcluded ? 1 : 0);
  const maxIndex = safeFloatToIndex(max, 'max') - (maxExcluded ? 1 : 0);
  if (minIndex > maxIndex) {
    throw new Error('fc.float16Array constraints.min must be smaller or equal to constraints.max');
  }
  if (
    constraints.noInteger &&
    noNaN &&
    indexToFloat(minIndex) === indexToFloat(maxIndex) &&
    safeNumberIsInteger(indexToFloat(minIndex)) &&
    indexToFloat(minIndex) !== 1024 &&
    indexToFloat(minIndex) !== -1024
  ) {
    // Excluding adjacent non-integer bounds can leave only an integer (or both
    // zeros). Reject that empty domain instead of filtering forever.
    throw new Error('fc.float16Array constraints.min must be smaller or equal to constraints.max');
  }

  // As for float(), reserve one index beyond the bounds for NaN. Keep NaN on
  // the side furthest from zero so that shrinking prefers ordinary numbers.
  const minIndexWithNaN = noNaN || maxIndex > 0 ? minIndex : minIndex - 1;
  const maxIndexWithNaN = noNaN || maxIndex <= 0 ? maxIndex : maxIndex + 1;
  let elements = integer({ min: minIndexWithNaN, max: maxIndexWithNaN }).map(
    (index) => (index < minIndex || index > maxIndex ? safeNaN : indexToFloat(index)),
    (value) => {
      if (typeof value !== 'number') throw new Error('Unsupported type');
      if (safeNumberIsNaN(value)) {
        if (noNaN) throw new Error('NaN is excluded');
        return maxIndexWithNaN !== maxIndex ? maxIndexWithNaN : minIndexWithNaN;
      }
      const index = safeFloatToIndex(value, 'min');
      if (index < minIndex || index > maxIndex) throw new Error('Value is outside the constraints');
      return index;
    },
  );
  if (constraints.noInteger) {
    // Binary16 values at or above 1024 are integers. The refinement reserves
    // these endpoints for the infinities when they are permitted by the bounds.
    elements = elements
      .map(
        (value) => (value === 1024 ? safePositiveInfinity : value === -1024 ? safeNegativeInfinity : value),
        (value) => {
          if (typeof value !== 'number') throw new Error('Unsupported type');
          return value === safePositiveInfinity ? 1024 : value === safeNegativeInfinity ? -1024 : value;
        },
      )
      .filter((value) => !safeNumberIsInteger(value));
  }
  return array(elements, constraints).map(
    (values) => Float16ArrayClass.from(values),
    (value: unknown) => {
      if (!(value instanceof Float16ArrayClass)) throw new Error('Unexpected type');
      return [...value];
    },
  );
}
