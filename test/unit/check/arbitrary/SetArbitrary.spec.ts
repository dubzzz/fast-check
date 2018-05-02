import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../src/check/arbitrary/definition/Shrinkable';
import { set, buildCompareFilter } from '../../../../src/check/arbitrary/SetArbitrary';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import Random from '../../../../src/random/generator/Random';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';

const customMapper = (v: number) => {
  return { key: v };
};
const customCompare = (a: { key: number }, b: { key: number }) => a.key === b.key;

const validSet = (s: number[]) => s.length === new Set(s).size && s.every(e => typeof e === 'number');
const validCustomSet = (s: { key: number }[]) => validSet(s.map(v => v.key));

describe('SetArbitrary', () => {
  describe('buildCompareFilter', () => {
    it('Should filter array from duplicated values', () =>
      fc.assert(
        fc.property(fc.array(fc.integer(1000)), tab => {
          const filter = buildCompareFilter<number>((a, b) => a === b);
          const adaptedTab = tab.map(v => new Shrinkable(v));
          const filteredTab = filter(adaptedTab);
          assert.ok(validSet(filteredTab.map(s => s.value)));
        })
      ));
  });
  describe('set', () => {
    it('Should not suggest input in shrinked values', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = set(integer());
          const shrinkable = arb.generate(mrng);
          for (const s of shrinkable.shrink()) assert.notDeepEqual(s.value, shrinkable.value);
        })
      ));
    describe('Given no length constraints [unique items only]', () => {
      genericHelper.isValidArbitrary(() => set(integer()), {
        isValidValue: (g: number[]) => validSet(g)
      });
    });
    describe('Given no length constraints but comparator [unique items for the specified comparator]', () => {
      genericHelper.isValidArbitrary(() => set(integer(1000).map(customMapper)), {
        isValidValue: (g: { key: number }[]) => validCustomSet(g)
      });
    });
    describe('Given maximal length only', () => {
      genericHelper.isValidArbitrary((maxLength: number) => set(integer(), maxLength), {
        seedGenerator: fc.nat(100),
        isValidValue: (g: number[], maxLength: number) => validSet(g) && g.length <= maxLength
      });
    });
    describe('Given minimal and maximal lengths', () => {
      genericHelper.isValidArbitrary(
        (constraints: { min: number; max: number }) => set(integer(), constraints.min, constraints.max),
        {
          seedGenerator: genericHelper.minMax(fc.nat(100)),
          isValidValue: (g: number[], constraints: { min: number; max: number }) =>
            validSet(g) && g.length >= constraints.min && g.length <= constraints.max
        }
      );
    });
  });
});
