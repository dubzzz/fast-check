import Arbitrary from './definition/Arbitrary';
import Random from '../../random/generator/Random';

import { set } from './SetArbitrary';
import { tuple } from './TupleArbitrary';

function toObject<T>(items: [string, T][]): { [Key: string]: T } {
  const obj: { [Key: string]: T } = {};
  for (const keyValue of items) {
    obj[keyValue[0]] = keyValue[1];
  }
  return obj;
}

function dictionary<T>(keyArb: Arbitrary<string>, valueArb: Arbitrary<T>): Arbitrary<{ [Key: string]: T }> {
  return set(tuple(keyArb, valueArb), (t1, t2) => t1[0] === t2[0]).map(toObject);
}

export { dictionary };
