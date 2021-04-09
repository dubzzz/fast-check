import { Arbitrary } from './definition/Arbitrary';

import { set } from '../../arbitrary/set';
import { tuple } from './TupleArbitrary';

/** @internal */
export function toObject<T>(items: [string, T][]): { [key: string]: T } {
  const obj: { [key: string]: T } = {};
  for (const keyValue of items) {
    obj[keyValue[0]] = keyValue[1];
  }
  return obj;
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
function dictionary<T>(keyArb: Arbitrary<string>, valueArb: Arbitrary<T>): Arbitrary<Record<string, T>> {
  return set(tuple(keyArb, valueArb), { compare: (t1, t2) => t1[0] === t2[0] }).map(toObject);
}

export { dictionary };
