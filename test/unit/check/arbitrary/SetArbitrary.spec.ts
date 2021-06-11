import * as fc from '../../../../lib/fast-check';

import { set } from '../../../../src/arbitrary/set';
import { nat } from '../../../../src/arbitrary/nat';
import { string } from '../../../../src/arbitrary/string';

import { generateOneValue } from './generic/GenerateOneValue';
import * as genericHelper from './generic/GenericArbitraryHelper';

const customMapper = (v: number) => {
  return { key: v };
};
const customCompare = (a: { key: number }, b: { key: number }) => a.key === b.key;

const validSet = (s: number[]) => s.length === new Set(s).size && s.every((e) => typeof e === 'number');
const validCustomSet = (s: { key: number }[]) => validSet(s.map((v) => v.key));

const isStrictlySmallerSet = (arr1: number[], arr2: number[]) => {
  if (arr1.length > arr2.length) return false;
  if (arr1.length === arr2.length) {
    return arr1.every((v, idx) => arr1[idx] <= arr2[idx]) && arr1.find((v, idx) => arr1[idx] < arr2[idx]) != null;
  }
  for (let idx1 = 0, idx2 = 0; idx1 < arr1.length && idx2 < arr2.length; ++idx1, ++idx2) {
    while (idx2 < arr2.length && arr1[idx1] > arr2[idx2]) ++idx2;
    if (idx2 === arr2.length) return false;
  }
  return true;
};
const isStrictlySmallerCustomSet = (arr1: { key: number }[], arr2: { key: number }[]) =>
  isStrictlySmallerSet(
    arr1.map((v) => v.key),
    arr2.map((v) => v.key)
  );

describe('SetArbitrary', () => {
  describe('set', () => {
    describe('Given no length constraints [unique items only]', () => {
      genericHelper.isValidArbitrary(() => set(nat()), {
        isStrictlySmallerValue: isStrictlySmallerSet,
        isValidValue: (g: number[]) => validSet(g),
      });
    });
    describe('Given no length constraints but comparator [unique items for the specified comparator]', () => {
      genericHelper.isValidArbitrary(() => set(nat().map(customMapper), { compare: customCompare }), {
        isStrictlySmallerValue: isStrictlySmallerCustomSet,
        isValidValue: (g: { key: number }[]) => validCustomSet(g),
      });
    });
    describe('Given minimal length only', () => {
      genericHelper.isValidArbitrary((minLength: number) => set(nat(), { minLength }), {
        seedGenerator: fc.nat(100),
        isStrictlySmallerValue: isStrictlySmallerSet,
        isValidValue: (g: number[], minLength: number) => validSet(g) && g.length >= minLength,
      });
    });
    describe('Given maximal length only', () => {
      genericHelper.isValidArbitrary((maxLength: number) => set(nat(), { maxLength }), {
        seedGenerator: fc.nat(100),
        isStrictlySmallerValue: isStrictlySmallerSet,
        isValidValue: (g: number[], maxLength: number) => validSet(g) && g.length <= maxLength,
      });
    });
    describe('Given minimal and maximal lengths', () => {
      genericHelper.isValidArbitrary(
        (constraints: { min: number; max: number }) =>
          set(nat(), { minLength: constraints.min, maxLength: constraints.max }),
        {
          seedGenerator: genericHelper.minMax(fc.nat(100)),
          isStrictlySmallerValue: isStrictlySmallerSet,
          isValidValue: (g: number[], constraints: { min: number; max: number }) =>
            validSet(g) && g.length >= constraints.min && g.length <= constraints.max,
        }
      );
    });
    describe('Still support non recommended signatures', () => {
      const compare = (a: string, b: string) => {
        return a.split('').sort().join('') === b.split('').sort().join('');
      };
      it('Should support fc.set(arb, maxLength)', () => {
        fc.assert(
          fc.property(fc.integer(), fc.nat(100), (seed, maxLength) => {
            const refArbitrary = set(nat(), { maxLength });
            const nonRecommendedArbitrary = set(nat(), maxLength);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
      it('Should support fc.set(arb, compare)', () => {
        fc.assert(
          fc.property(fc.integer(), (seed) => {
            const refArbitrary = set(string(), { compare });
            const nonRecommendedArbitrary = set(string(), compare);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
      it('Should support fc.set(arb, maxLength, compare)', () => {
        fc.assert(
          fc.property(fc.integer(), fc.nat(100), (seed, maxLength) => {
            const refArbitrary = set(string(), { maxLength, compare });
            const nonRecommendedArbitrary = set(string(), maxLength, compare);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
      it('Should support fc.set(arb, minLength, maxLength)', () => {
        fc.assert(
          fc.property(fc.integer(), genericHelper.minMax(fc.nat(100)), (seed, minMaxLength) => {
            const refArbitrary = set(nat(), { minLength: minMaxLength.min, maxLength: minMaxLength.max });
            const nonRecommendedArbitrary = set(nat(), minMaxLength.min, minMaxLength.max);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
      it('Should support fc.set(arb, minLength, maxLength, compare)', () => {
        fc.assert(
          fc.property(fc.integer(), genericHelper.minMax(fc.nat(100)), (seed, minMaxLength) => {
            const refArbitrary = set(string(), { minLength: minMaxLength.min, maxLength: minMaxLength.max, compare });
            const nonRecommendedArbitrary = set(string(), minMaxLength.min, minMaxLength.max, compare);
            expect(generateOneValue(seed, nonRecommendedArbitrary)).toEqual(generateOneValue(seed, refArbitrary));
          })
        );
      });
    });
  });
});
