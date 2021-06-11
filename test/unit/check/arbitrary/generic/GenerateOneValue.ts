import prand from 'pure-rand';
import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { Random } from '../../../../../src/random/generator/Random';

export const generateOneValue = <T>(seed: number, arb: Arbitrary<T>): T => {
  const mrng = new Random(prand.xoroshiro128plus(seed));
  return arb.generate(mrng).value;
};
