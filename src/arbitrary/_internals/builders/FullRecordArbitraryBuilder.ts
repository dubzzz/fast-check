import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { tuple } from '../../tuple';
import { EnumerableKeyOf, extractEnumerableKeys } from '../helpers/EnumerableKeysExtractor';

/** @internal */
export function buildFullRecordArbitrary<T>(recordModel: { [K in keyof T]: Arbitrary<T[K]> }): Arbitrary<T> {
  const keys = extractEnumerableKeys(recordModel);
  const arbs: Arbitrary<T[keyof T]>[] = [];
  for (let index = 0; index !== keys.length; ++index) {
    arbs.push(recordModel[keys[index]]);
  }
  return tuple(...arbs).map((gs: T[keyof T][]): T => {
    const obj: Partial<Record<EnumerableKeyOf<T>, any>> = {};
    for (let idx = 0; idx !== keys.length; ++idx) {
      obj[keys[idx]] = gs[idx];
    }
    return obj as T;
  });
}
