import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { convertFromNext, convertToNext } from '../check/arbitrary/definition/Converters';
import { set } from './set';
import { tuple } from './tuple';
import { keyValuePairsToObjectMapper, keyValuePairsToObjectUnmapper } from './_internals/mappers/KeyValuePairsToObject';

/**
 * For dictionaries with keys produced by `keyArb` and values from `valueArb`
 *
 * @param keyArb - Arbitrary used to generate the keys of the object
 * @param valueArb - Arbitrary used to generate the values of the object
 *
 * @remarks Since 1.0.0
 * @public
 */
export function dictionary<T>(keyArb: Arbitrary<string>, valueArb: Arbitrary<T>): Arbitrary<Record<string, T>> {
  return convertFromNext(
    convertToNext(set(tuple(keyArb, valueArb), { compare: { selector: (t) => t[0] } })).map(
      keyValuePairsToObjectMapper,
      keyValuePairsToObjectUnmapper
    )
  );
}
