import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { uniqueArray } from './uniqueArray.js';
import type { DepthSize, SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength.js';
import type { DepthIdentifier } from './_internals/helpers/DepthContext.js';
import { arrayToSetMapper, arrayToSetUnmapper } from './_internals/mappers/ArrayToSet.js';

/**
 * Constraints to be applied on {@link set}
 * @remarks Since 4.4.0
 * @public
 */
export type SetConstraints = {
  /**
   * Lower bound of the generated set size
   * @defaultValue 0
   * @remarks Since 4.4.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated set size
   * @defaultValue 0x7fffffff — _defaulting seen as "max non specified" when `defaultSizeToMaxWhenMaxSpecified=true`_
   * @remarks Since 4.4.0
   */
  maxLength?: number;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 4.4.0
   */
  size?: SizeForArbitrary;
  /**
   * When receiving a depth identifier, the arbitrary will impact the depth
   * attached to it to avoid going too deep if it already generated lots of items.
   *
   * In other words, if the number of generated values within the collection is large
   * then the generated items will tend to be less deep to avoid creating structures a lot
   * larger than expected.
   *
   * @remarks Since 4.4.0
   */
  depthIdentifier?: DepthIdentifier | string;
  /**
   * While going deeper and deeper within a recursive structure (see {@link letrec}),
   * this factor will be used to increase the probability to generate smaller sets.
   *
   * @remarks Since 4.x.0
   */
  depthSize?: DepthSize;
  /**
   * Maximal authorized depth.
   * Once this depth has been reached only sets of {@link SetConstraints.minLength | minLength}
   * will be generated.
   *
   * @defaultValue Number.POSITIVE_INFINITY — _defaulting seen as "max non specified" when `defaultSizeToMaxWhenMaxSpecified=true`_
   * @remarks Since 4.x.0
   */
  maxDepth?: number;
};

/**
 * For sets of values coming from `arb`
 *
 * All the values in the set are unique. Comparison of values relies on `SameValueZero`
 * which is the same comparison algorithm used by `Set`.
 *
 * @param arb - Arbitrary used to generate the values inside the set
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 4.4.0
 * @public
 */
export function set<T>(arb: Arbitrary<T>, constraints: SetConstraints = {}): Arbitrary<Set<T>> {
  return uniqueArray(arb, {
    minLength: constraints.minLength,
    maxLength: constraints.maxLength,
    size: constraints.size,
    depthIdentifier: constraints.depthIdentifier,
    depthSize: constraints.depthSize,
    maxDepth: constraints.maxDepth,
    comparator: 'SameValueZero',
  }).map(arrayToSetMapper, arrayToSetUnmapper);
}
