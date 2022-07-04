import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { ArrayArbitrary } from './_internals/ArrayArbitrary';
import {
  MaxLengthUpperBound,
  SizeForArbitrary,
  maxGeneratedLengthFromSizeForArbitrary,
} from './_internals/helpers/MaxLengthFromMinLength';
import { DepthIdentifier } from './_internals/helpers/DepthContext';

/**
 * Constraints to be applied on {@link array}
 * @remarks Since 2.4.0
 * @public
 */
export interface ArrayConstraints {
  /**
   * Lower bound of the generated array size
   * @remarks Since 2.4.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated array size
   * @remarks Since 2.4.0
   */
  maxLength?: number;
  /**
   * Define how large the generated values should be (at max)
   *
   * When used in conjonction with `maxLength`, `size` will be used to define
   * the upper bound of the generated array size while `maxLength` will be used
   * to define and document the general maximal length allowed for this case.
   *
   * @remarks Since 2.22.0
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
   * For the moment, the depth is not taken into account to compute the number of items to
   * define for a precise generate call of the array. Just applied onto eligible items.
   *
   * @remarks Since 2.25.0
   */
  depthIdentifier?: DepthIdentifier | string;
}

/**
 * Extra but internal constraints that can be passed to array.
 * This extra set is made of constraints mostly targets experimental and internal features not yet mature to be exposed.
 * @internal
 */
export interface ArrayConstraintsInternal<T> extends ArrayConstraints {
  /**
   * Extra user-definable and hardcoded values.
   * Each entry in the array could be used to build the final generated value outputed by the arbitrary of array on generate.
   * Each entry must have at least one element of type T into it.
   * Each T must be a value acceptable for the arbitrary passed to the array.
   */
  experimentalCustomSlices?: T[][];
}

/**
 * For arrays of values coming from `arb`
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances (since 2.4.0)
 *
 * @remarks Since 0.0.1
 * @public
 */
function array<T>(arb: Arbitrary<T>, constraints: ArrayConstraints = {}): Arbitrary<T[]> {
  const size = constraints.size;
  const minLength = constraints.minLength || 0;
  const maxLengthOrUnset = constraints.maxLength;
  const depthIdentifier = constraints.depthIdentifier;
  const maxLength = maxLengthOrUnset !== undefined ? maxLengthOrUnset : MaxLengthUpperBound;
  const specifiedMaxLength = maxLengthOrUnset !== undefined;
  const maxGeneratedLength = maxGeneratedLengthFromSizeForArbitrary(size, minLength, maxLength, specifiedMaxLength);
  const customSlices = (constraints as ArrayConstraintsInternal<T>).experimentalCustomSlices || [];
  return new ArrayArbitrary<T>(arb, minLength, maxGeneratedLength, maxLength, depthIdentifier, undefined, customSlices);
}
export { array };
