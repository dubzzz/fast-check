import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { safeIndexOf, safePush } from '../../../utils/globals';
import { boolean } from '../../boolean';
import { constant } from '../../constant';
import { option } from '../../option';
import { tuple } from '../../tuple';
import type { EnumerableKeyOf} from '../helpers/EnumerableKeysExtractor';
import { extractEnumerableKeys } from '../helpers/EnumerableKeysExtractor';
import {
  buildValuesAndSeparateKeysToObjectMapper,
  buildValuesAndSeparateKeysToObjectUnmapper,
} from '../mappers/ValuesAndSeparateKeysToObject';

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
