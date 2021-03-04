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
        fc.property(fc.integer(), fc.array(fc.integer(), { minLength: 1 }), (seed, choices) => {
          const gFreq = frequency(...choices.map((c) => Object({ weight: 1, arbitrary: stubArb.counter(c) }))).generate(
            rng(seed)
          ).value;
          const gOneOf = oneof(...choices.map(stubArb.counter)).generate(rng(seed)).value;
          return gFreq === gOneOf;
        })
      ));
    it('Should produce the same as oneof with sum of weights elements', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(weightArb(), { minLength: 1 }), (seed, choices) => {
          const expand = (value: number, num: number): number[] => [...Array(num)].map(() => value);

          const choicesOneOf = [...choices].reduce((p: number[], c) => p.concat(...expand(c[0], c[1])), []);

          const gFreq = frequency(
            ...choices.map((c) => Object({ weight: c[1], arbitrary: stubArb.counter(c[0]) }))
          ).generate(rng(seed)).value;
          const gOneOf = oneof(...choicesOneOf.map(stubArb.counter)).generate(rng(seed)).value;
          return gFreq === gOneOf;
        })
      ));
    it('Should reject calls without any weighted arbitraries', () => {
      expect(() => frequency()).toThrowError();
    });
    it('Should reject calls including at one strictly negative weight', () =>
      fc.assert(
        fc.property(
          fc.integer({ max: -1 }),
          fc.array(fc.nat()),
          fc.array(fc.nat()),
          (negativeWeight, headingWeights, traillingWeights) => {
            expect(() =>
              frequency(
                ...[...headingWeights, negativeWeight, ...traillingWeights].map((weight) => ({
                  weight,
                  arbitrary: stubArb.single(0),
                }))
              )
            ).toThrowError();
          }
        )
      ));
    it('Should reject calls having a total weight of zero', () =>
      fc.assert(
        fc.property(fc.nat({ max: 1000 }), (numEntries) => {
          // Combined with: 'Should reject calls including at one strictly negative weight'
          // it means that we have: 'Should reject calls having a total weight inferior or equal to zero'
          expect(() =>
            frequency(
              ...[...Array(numEntries)].map(() => ({
                weight: 0,
                arbitrary: stubArb.single(0),
              }))
            )
          ).toThrowError();
        })
      ));
    it('Should not reject calls defining a strictly positive total weight without any negative weights', () =>
      fc.assert(
        fc.property(
          fc.integer({ min: 1 }),
          fc.array(fc.nat()),
          fc.array(fc.nat()),
          (negativeWeight, headingWeights, traillingWeights) => {
            expect(() =>
              frequency(
                ...[...headingWeights, negativeWeight, ...traillingWeights].map((weight) => ({
                  weight,
                  arbitrary: stubArb.single(0),
                }))
              )
            ).not.toThrowError();
          }
        )
      ));
  });
});
