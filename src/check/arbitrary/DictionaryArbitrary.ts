import Random from '../../random/generator/Random';
import Arbitrary from './definition/Arbitrary';

import { set } from './SetArbitrary';
import { tuple } from './TupleArbitrary';

function toObject<T>(items: [string, T][]): { [key: string]: T } {
  const obj: { [key: string]: T } = {};
  for (const keyValue of items) {
    obj[keyValue[0]] = keyValue[1];
  }
  return obj;
}

function dictionary<T>(keyArb: Arbitrary<string>, valueArb: Arbitrary<T>): Arbitrary<{ [key: string]: T }> {
  return set(tuple(keyArb, valueArb), (t1, t2) => t1[0] === t2[0]).map(toObject);
}

export { dictionary };
