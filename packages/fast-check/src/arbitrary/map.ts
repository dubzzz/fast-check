import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { tuple } from './tuple.js';
import { uniqueArray } from './uniqueArray.js';
import type { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength.js';
import { arrayToMapMapper, arrayToMapUnmapper } from './_internals/mappers/ArrayToMap.js';
import type { DepthIdentifier } from './_internals/helpers/DepthContext.js';

/** @internal */
function mapKeyExtractor<K, V>(entry: [K, V]): K {
  return entry[0];
}

/**
 * Constraints to be applied on {@link map}
 * @remarks Since 4.4.0
 * @public
 */
export interface MapConstraints {
  /**
   * Lower bound for the number of entries defined into the generated instance
   * @defaultValue 0
   * @remarks Since 4.4.0
   */
  minKeys?: number;
  /**
   * Upper bound for the number of entries defined into the generated instance
   * @defaultValue 0x7fffffff
   * @remarks Since 4.4.0
   */
  maxKeys?: number;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 4.4.0
   */
  size?: SizeForArbitrary;
  /**
   * Depth identifier can be used to share the current depth between several instances.
   *
   * By default, if not specified, each instance of map will have its own depth.
   * In other words: you can have depth=1 in one while you have depth=100 in another one.
   *
   * @remarks Since 4.4.0
   */
  depthIdentifier?: DepthIdentifier | string;
}

/**
 * For Maps with keys produced by `keyArb` and values from `valueArb`
 *
 * @param keyArb - Arbitrary used to generate the keys of the Map
 * @param valueArb - Arbitrary used to generate the values of the Map
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 4.4.0
 * @public
 */
export function map<K, V>(
  keyArb: Arbitrary<K>,
  valueArb: Arbitrary<V>,
  constraints: MapConstraints = {},
): Arbitrary<Map<K, V>> {
  return uniqueArray(tuple(keyArb, valueArb), {
    minLength: constraints.minKeys,
    maxLength: constraints.maxKeys,
    size: constraints.size,
    selector: mapKeyExtractor,
    depthIdentifier: constraints.depthIdentifier,
    comparator: 'SameValueZero',
  }).map(arrayToMapMapper, arrayToMapUnmapper);
}
