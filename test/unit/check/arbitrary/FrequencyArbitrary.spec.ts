import * as fc from '../../../../lib/fast-check';

import { frequency } from '../../../../src/check/arbitrary/FrequencyArbitrary';
import { oneof } from '../../../../src/check/arbitrary/OneOfArbitrary';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';

describe('FrequencyArbitrary', () => {
  describe('frequency', () => {
    const MAX_WEIGHT = 100;
    const weightArb = () => fc.tuple(fc.integer(), fc.integer(1, MAX_WEIGHT));
    const rng = (seed: number) => stubRng.mutable.fastincrease(seed);
    it('Should produce the same as oneof when called on weights of 1', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.integer(), 1, 10), (seed, choices) => {
          const gFreq = frequency(...choices.map(c => Object({ weight: 1, arbitrary: stubArb.counter(c) }))).generate(
            rng(seed)
          ).value;
          const gOneOf = oneof(...choices.map(stubArb.counter)).generate(rng(seed)).value;
          return gFreq === gOneOf;
        })
      ));
    it('Should produce the same as oneof with sum of weights elements', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(weightArb(), 1, 10), (seed, choices) => {
          const expand = (value: number, num: number): number[] => [...Array(num)].map(() => value);

          const choicesOneOf = [...choices].reduce((p: number[], c) => p.concat(...expand(c[0], c[1])), []);

          const gFreq = frequency(
            ...choices.map(c => Object({ weight: c[1], arbitrary: stubArb.counter(c[0]) }))
          ).generate(rng(seed)).value;
          const gOneOf = oneof(...choicesOneOf.map(stubArb.counter)).generate(rng(seed)).value;
          return gFreq === gOneOf;
        })
      ));
  });
});
