import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { IteratorArbitrary } from './_internals/IteratorArbitrary.js';
import type { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength.js';
import { maxGeneratedLengthFromSizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength.js';

/**
 * Constraints to be applied on {@link iterator}
 * @remarks Since 4.3.0
 * @public
 */
export interface IteratorConstraints {
  /**
   * Lower bound for the number of items the generated iterators will yield before completing.
   * `Number.POSITIVE_INFINITY` is accepted: it forces every generated iterator to be a never-ending one.
   *
   * @defaultValue 0
   * @remarks Since 5.0.0
   */
  minLength?: number;
  /**
   * Upper bound for the number of items the generated iterators will yield before completing.
   * `Number.POSITIVE_INFINITY` is accepted and means never-ending iterators may be generated,
   * while any finite value makes every generated iterator finite.
   *
   * @defaultValue Number.POSITIVE_INFINITY by default, Number.MAX_SAFE_INTEGER when `noDefaultInfinity` is true
   * @remarks Since 5.0.0
   */
  maxLength?: number;
  /**
   * By default, `maxLength` defaults to `Number.POSITIVE_INFINITY` meaning never-ending iterators
   * get generated from time to time. By setting `noDefaultInfinity` to true, you move this default
   * to `Number.MAX_SAFE_INTEGER` so that only finite iterators get generated unless you explicitly
   * pass `maxLength: Number.POSITIVE_INFINITY`.
   *
   * @defaultValue false
   * @remarks Since 5.0.0
   */
  noDefaultInfinity?: boolean;
  /**
   * Define how large the generated values should be (at max).
   *
   * It caps the number of items the generated finite iterators will yield the same way it caps
   * the length of arrays, `maxLength` staying the hard upper bound.
   *
   * It has no impact on never-ending iterators.
   *
   * @remarks Since 5.0.0
   */
  size?: SizeForArbitrary;
  /**
   * Do not save items emitted by this arbitrary and print count instead.
   * Recommended for very large tests.
   *
   * @defaultValue false
   */
  noHistory?: boolean;
}

/**
 * Produce an iterator of values
 *
 * By default, most of the generated iterators are finite ones: they stop yielding items after
 * a number of items computed the same way as the length of arrays. From time to time, a
 * never-ending iterator gets generated as the default upper bound is `Number.POSITIVE_INFINITY`:
 * pass a finite `maxLength` or set `noDefaultInfinity` to true to only produce finite iterators,
 * or set `minLength` to `Number.POSITIVE_INFINITY` to only produce never-ending ones.
 *
 * WARNING: By default, iterator remembers all values it has ever
 * generated. This causes unbounded memory growth during large tests.
 * Set noHistory to disable.
 *
 * WARNING: Requires Object.assign
 *
 * @param arb - Arbitrary used to generate the values
 * @param constraints - Constraints to apply when building instances (since 4.3.0)
 *
 * @remarks Since 1.8.0
 * @public
 */
function iterator<T>(
  arb: Arbitrary<T>,
  constraints: IteratorConstraints = {},
): Arbitrary<IteratorObject<T, undefined>> {
  const history = !constraints.noHistory;
  const minLength = constraints.minLength !== undefined ? constraints.minLength : 0;
  const maxLength =
    constraints.maxLength !== undefined
      ? constraints.maxLength
      : constraints.noDefaultInfinity
        ? Number.MAX_SAFE_INTEGER
        : Number.POSITIVE_INFINITY;
  if (minLength < 0 || (!Number.isSafeInteger(minLength) && minLength !== Number.POSITIVE_INFINITY)) {
    throw new Error('fc.iterator expects minLength to be a positive integer or Number.POSITIVE_INFINITY');
  }
  if (maxLength < 0 || (!Number.isSafeInteger(maxLength) && maxLength !== Number.POSITIVE_INFINITY)) {
    throw new Error('fc.iterator expects maxLength to be a positive integer or Number.POSITIVE_INFINITY');
  }
  if (minLength > maxLength) {
    throw new Error('fc.iterator expects minLength to be smaller than or equal to maxLength');
  }
  const specifiedMaxLength = constraints.maxLength !== undefined && constraints.maxLength !== Number.POSITIVE_INFINITY;

  // By construct, it will always be a finite value except for minLength being +infinity
  const maxGeneratedLength =
    minLength === Number.POSITIVE_INFINITY
      ? Number.POSITIVE_INFINITY
      : maxGeneratedLengthFromSizeForArbitrary(
          constraints.size,
          minLength,
          maxLength !== Number.POSITIVE_INFINITY ? maxLength : Number.MAX_SAFE_INTEGER,
          specifiedMaxLength,
        );
  return new IteratorArbitrary(arb, history, minLength, maxGeneratedLength, maxLength);
}

export { iterator };
