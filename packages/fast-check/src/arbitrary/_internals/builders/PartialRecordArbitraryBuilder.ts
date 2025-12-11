import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { safeIndexOf, safePush } from '../../../utils/globals.js';
import { boolean } from '../../boolean.js';
import { constant } from '../../constant.js';
import { option } from '../../option.js';
import { tuple } from '../../tuple.js';
import type { EnumerableKeyOf } from '../helpers/EnumerableKeysExtractor.js';
import { extractEnumerableKeys } from '../helpers/EnumerableKeysExtractor.js';
import {
  buildValuesAndSeparateKeysToObjectMapper,
  buildValuesAndSeparateKeysToObjectUnmapper,
} from '../mappers/ValuesAndSeparateKeysToObject.js';

const noKeyValue: unique symbol = Symbol('no-key');
type NoKeyType = typeof noKeyValue;

/** @internal */
export function buildPartialRecordArbitrary<T, TKeys extends EnumerableKeyOf<T>>(
  recordModel: { [K in keyof T]: Arbitrary<T[K]> },
  requiredKeys: TKeys[] | undefined,
  noNullPrototype: boolean,
): Arbitrary<Partial<T> & Pick<T, TKeys>> {
  const keys = extractEnumerableKeys(recordModel);
  const arbs: Arbitrary<T[keyof T] | NoKeyType>[] = [];
  for (let index = 0; index !== keys.length; ++index) {
    const k: EnumerableKeyOf<T> = keys[index];
    const requiredArbitrary = recordModel[k];
    if (requiredKeys === undefined || safeIndexOf(requiredKeys, k as TKeys) !== -1) {
      safePush(arbs, requiredArbitrary);
    } else {
      safePush(arbs, option(requiredArbitrary, { nil: noKeyValue as NoKeyType }));
    }
  }
  return tuple(tuple(...arbs), noNullPrototype ? constant(false) : boolean()).map(
    buildValuesAndSeparateKeysToObjectMapper<T, NoKeyType>(keys, noKeyValue),
    buildValuesAndSeparateKeysToObjectUnmapper<T, NoKeyType>(keys, noKeyValue),
  );
}
