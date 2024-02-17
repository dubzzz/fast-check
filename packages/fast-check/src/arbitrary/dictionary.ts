import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { tuple } from './tuple';
import { uniqueArray } from './uniqueArray';
import type { SizeForArbitrary } from './_internals/helpers/MaxLengthFromMinLength';
import { keyValuePairsToObjectMapper, keyValuePairsToObjectUnmapper } from './_internals/mappers/KeyValuePairsToObject';
import { constant } from './constant';
import { boolean } from './boolean';
import type { DepthIdentifier } from './_internals/helpers/DepthContext';

/** @internal */
function dictionaryKeyExtractor(entry: [string, unknown]): string {
  return entry[0];
}

/**
 * Constraints to be applied on {@link dictionary}
 * @remarks Since 2.22.0
 * @public
 */
export interface DictionaryConstraints {
  /**
   * Lower bound for the number of keys defined into the generated instance
   * @defaultValue 0
   * @remarks Since 2.22.0
   */
  minKeys?: number;
  /**
   * Lower bound for the number of keys defined into the generated instance
   * @defaultValue 0x7fffffff — _defaulting seen as "max non specified" when `defaultSizeToMaxWhenMaxSpecified=true`_
   * @remarks Since 2.22.0
   */
  maxKeys?: number;
  /**
   * Define how large the generated values should be (at max)
   * @remarks Since 2.22.0
   */
  size?: SizeForArbitrary;
  /**
   * Depth identifier can be used to share the current depth between several instances.
   *
   * By default, if not specified, each instance of dictionary will have its own depth.
   * In other words: you can have depth=1 in one while you have depth=100 in another one.
   *
   * @remarks Since 3.15.0
   */
  depthIdentifier?: DepthIdentifier | string;
  /**
   * Do not generate objects with null prototype
   * @defaultValue false
   * @remarks Since 3.13.0
   */
  noNullPrototype?: boolean;
}

/**
 * For dictionaries with keys produced by `keyArb` and values from `valueArb`
 *
 * @param keyArb - Arbitrary used to generate the keys of the object
 * @param valueArb - Arbitrary used to generate the values of the object
 *
 * @remarks Since 1.0.0
 * @public
 */
export function dictionary<T>(
  keyArb: Arbitrary<string>,
  valueArb: Arbitrary<T>,
  constraints: DictionaryConstraints = {},
): Arbitrary<Record<string, T>> {
  const noNullPrototype = !!constraints.noNullPrototype;
  return tuple(
    uniqueArray(tuple(keyArb, valueArb), {
      minLength: constraints.minKeys,
      maxLength: constraints.maxKeys,
      size: constraints.size,
      selector: dictionaryKeyExtractor,
      depthIdentifier: constraints.depthIdentifier,
    }),
    noNullPrototype ? constant(false) : boolean(),
  ).map(keyValuePairsToObjectMapper, keyValuePairsToObjectUnmapper);
}
