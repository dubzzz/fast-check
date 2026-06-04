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
import { ValuesAndSeparateKeysArbitrary } from '../ValuesAndSeparateKeysArbitrary.js';

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
  const nullPrototypeArb = noNullPrototype ? constant(false) : boolean();
  const mapper = buildValuesAndSeparateKeysToObjectMapper<T, NoKeyType>(keys, noKeyValue);
  const unmapper = buildValuesAndSeparateKeysToObjectUnmapper<T, NoKeyType>(keys, noKeyValue);
  // The tuple-based arbitrary is kept as a fallback: it powers `canShrinkWithoutContext` and the shrink of
  // values that were not produced by our own `generate` (eg: user-provided values).
  const fallback = tuple(tuple(...arbs), nullPrototypeArb).map(mapper, unmapper);
  type TObj = Partial<T> & Pick<T, TKeys>;
  return new ValuesAndSeparateKeysArbitrary<TObj>(
    arbs as Arbitrary<unknown>[],
    nullPrototypeArb,
    mapper as unknown as (definition: [unknown[], boolean]) => TObj,
    fallback as Arbitrary<TObj>,
  );
}
