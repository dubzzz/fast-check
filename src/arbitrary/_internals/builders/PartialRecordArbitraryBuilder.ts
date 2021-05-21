import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { option } from '../../option';
import { tuple } from '../../tuple';
import { EnumerableKeyOf, extractEnumerableKeys } from '../helpers/EnumerableKeysExtractor';

/** @internal */
export function buildPartialRecordArbitrary<T, TKeys extends EnumerableKeyOf<T>>(
  recordModel: { [K in keyof T]: Arbitrary<T[K]> },
  requiredKeys: TKeys[] | undefined
): Arbitrary<Partial<T> & Pick<T, TKeys>> {
  const keys = extractEnumerableKeys(recordModel);
  const arbs: Arbitrary<{ value: T[keyof T] } | null>[] = [];
  for (let index = 0; index !== keys.length; ++index) {
    const k: EnumerableKeyOf<T> = keys[index];
    const requiredArbitrary = recordModel[k].map((v) => ({ value: v }));
    if (requiredKeys === undefined || requiredKeys.indexOf(k as TKeys) !== -1) arbs.push(requiredArbitrary);
    else arbs.push(option(requiredArbitrary));
  }
  return tuple(...arbs).map((gs: ({ value: T[keyof T] } | null)[]): Partial<T> & Pick<T, TKeys> => {
    const obj: Partial<Record<EnumerableKeyOf<T>, T[keyof T]>> = {};
    for (let idx = 0; idx !== keys.length; ++idx) {
      const valueWrapper = gs[idx];
      if (valueWrapper !== null) {
        obj[keys[idx]] = valueWrapper.value;
      }
    }
    return obj as Partial<T> & Pick<T, TKeys>;
  });
}
