import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../src/check/arbitrary/definition/Shrinkable';
import { set, buildCompareFilter } from '../../../../src/check/arbitrary/SetArbitrary';
import { char } from '../../../../src/check/arbitrary/CharacterArbitrary';
import Random from '../../../../src/random/generator/Random';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';

const customMapper = (v: string) => {
  return { key: v };
};
const validSet = (s: string[]) => {
  for (let idx = s.length - 1; idx !== -1; --idx) {
    if (s.slice(idx + 1).indexOf(s[idx]) !== -1) return false;
  }
  return true;
};
const validCustomSet = (s: { key: string }[]) => validSet(s.map(v => v.key));
const customCompare = (a: { key: string }, b: { key: string }) => a.key === b.key;

describe('SetArbitrary', () => {
  describe('buildCompareFilter', () => {
    it('Should filter array from duplicated values', () =>
      fc.assert(
        fc.property(fc.array(fc.char()), tab => {
          const filter = buildCompareFilter<string>((a, b) => a === b);
          const adaptedTab = tab.map(v => new Shrinkable(v));
          const filteredTab = filter(adaptedTab);
          assert.ok(validSet(filteredTab.map(s => s.value)));
        })
      ));
  });
  describe('set', () => {
    it('Should generate an array using specified arbitrary', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = set(char().map(customMapper)).generate(mrng).value;
          assert.ok(g.every(v => typeof v.key === 'string'));
        })
      ));
    it('Should not contain twice the same value', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = set(char()).generate(mrng).value;
          assert.ok(validSet(g));
        })
      ));
    it('Should not contain twice the same value given a custom compare', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = set(char().map(customMapper), customCompare).generate(mrng).value;
          assert.ok(validCustomSet(g));
        })
      ));
    it('Should generate an array given maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(0, 1000), (seed, maxLength) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = set(char(), maxLength).generate(mrng).value;
          assert.ok(validSet(g));
          return g.length <= maxLength;
        })
      ));
    it('Should generate an array given minimal and maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(20), fc.nat(1000), (seed, aLength, bLength) => {
          const minLength = Math.min(aLength, bLength);
          const maxLength = Math.max(aLength, bLength);
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = set(char(), minLength, maxLength).generate(mrng).value;
          assert.ok(validSet(g));
          return minLength <= g.length && g.length <= maxLength;
        })
      ));
    it('Should shrink values as valid sets', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = set(char());
          const shrinkable = arb.generate(mrng);
          for (const s of shrinkable.shrink())
            assert.ok(
              validSet(s.value),
              `${JSON.stringify(s.value)} is not a valid shrink for ${JSON.stringify(shrinkable.value)}`
            );
        })
      ));
    it('Should not suggest input in shrinked values', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = set(char());
          const shrinkable = arb.generate(mrng);
          for (const s of shrinkable.shrink()) assert.notDeepEqual(s.value, shrinkable.value);
        })
      ));
    genericHelper.testNoImpactOfMutation(set(char()), tab => {
      for (let idx = 0; idx !== tab.length; ++idx) tab[idx] = '.';
    });
  });
});
