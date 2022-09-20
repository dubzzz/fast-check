import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { safeIndexOf, safePush } from '../../../utils/globals';
import { option } from '../../option';
import { tuple } from '../../tuple';
import { EnumerableKeyOf, extractEnumerableKeys } from '../helpers/EnumerableKeysExtractor';
import {
  buildValuesAndSeparateKeysToObjectMapper,
  buildValuesAndSeparateKeysToObjectUnmapper,
} from '../mappers/ValuesAndSeparateKeysToObject';

const noKeyValue: unique symbol = Symbol('no-key');
type NoKeyType = typeof noKeyValue;

/** @internal */
export function buildPartialRecordArbitrary<T, TKeys extends EnumerableKeyOf<T>>(
  recordModel: { [K in keyof T]: Arbitrary<T[K]> },
  requiredKeys: TKeys[] | undefined
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
  return tuple(...arbs).map(
    buildValuesAndSeparateKeysToObjectMapper<T, NoKeyType>(keys, noKeyValue),
    buildValuesAndSeparateKeysToObjectUnmapper<T, NoKeyType>(keys, noKeyValue)
  );
}
