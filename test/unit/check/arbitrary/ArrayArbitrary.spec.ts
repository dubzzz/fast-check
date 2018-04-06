import * as assert from 'power-assert';
import fc from '../../../../lib/fast-check';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../src/check/arbitrary/definition/Shrinkable';
import { array } from '../../../../src/check/arbitrary/ArrayArbitrary';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import Random from '../../../../src/random/generator/Random';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';

class DummyArbitrary extends Arbitrary<any> {
  constructor(public value: () => number) {
    super();
  }
  generate(mrng: Random): Shrinkable<any> {
    return new Shrinkable({ key: this.value() });
  }
}

describe('ArrayArbitrary', () => {
  describe('array', () => {
    it('Should generate an array using specified arbitrary', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = array(new DummyArbitrary(() => 42)).generate(mrng).value;
          assert.deepEqual(g, [...Array(g.length)].map(() => new Object({ key: 42 })));
          return true;
        })
      ));
    it('Should generate the same array with the same random', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng1 = stubRng.mutable.fastincrease(seed);
          const mrng2 = stubRng.mutable.fastincrease(seed);
          assert.deepEqual(array(integer()).generate(mrng1).value, array(integer()).generate(mrng2).value);
          return true;
        })
      ));
    it('Should generate an array calling multiple times arbitrary generator', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = stubRng.mutable.fastincrease(seed);
          let num = 0;
          const g = array(new DummyArbitrary(() => ++num)).generate(mrng).value;
          let numBis = 0;
          assert.deepEqual(g, [...Array(g.length)].map(() => new Object({ key: ++numBis })));
          return true;
        })
      ));
    it('Should generate an array given maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(0, 10000), (seed, maxLength) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = array(new DummyArbitrary(() => 42), maxLength).generate(mrng).value;
          return g.length <= maxLength;
        })
      ));
    it('Should generate an array given minimal and maximal length', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(10000), fc.nat(10000), (seed, aLength, bLength) => {
          const minLength = Math.min(aLength, bLength);
          const maxLength = Math.max(aLength, bLength);
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = array(new DummyArbitrary(() => 42), minLength, maxLength).generate(mrng).value;
          return minLength <= g.length && g.length <= maxLength;
        })
      ));
    it('Should shrink values in the defined range', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.nat(), (seed, min, num) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = array(integer(min, min + num));
          const shrinkable = arb.generate(mrng);
          return shrinkable.shrink().every(s => s.value.every(vv => min <= vv && vv <= min + num));
        })
      ));
    it('Should shrink values in the min/max size range', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(50), fc.nat(50), (seed, aLength, bLength) => {
          const minLength = Math.min(aLength, bLength);
          const maxLength = Math.max(aLength, bLength);
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = array(new DummyArbitrary(() => 42), minLength, maxLength);
          const shrinkable = arb.generate(mrng);
          return shrinkable.shrink().every(s => minLength <= s.value.length && s.value.length <= maxLength);
        })
      ));
    it('Should not suggest input in shrinked values', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.nat(), (seed, min, num) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const arb = array(integer(min, min + num));
          const shrinkable = arb.generate(mrng);
          const tab = shrinkable.value;
          return shrinkable
            .shrink()
            .every(s => s.value.length !== tab.length || !s.value.every((vv, idx) => vv === tab[idx]));
        })
      ));
    genericHelper.testNoImpactOfMutation(array(integer()), tab => {
      for (let idx = 0; idx !== tab.length; ++idx) tab[idx] = 0;
    });

    // // array of non objects is not impacted by mutations
    // // however an array of other objects is impacted by such modifications
    // // in general the predicates used inside properties should not change the inputs
    //
    // genericHelper.testNoImpactOfMutation(array(array(integer())), tabtab => {
    //   for (let idx = 0; idx !== tabtab.length; ++idx)
    //     for (let idx2 = 0 ; idx2 !== tabtab[idx].length ; ++idx2)
    //       tabtab[idx][idx2] = 0;
    // });
  });
});
