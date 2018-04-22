import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../src/check/arbitrary/definition/Shrinkable';
import { array } from '../../../../src/check/arbitrary/ArrayArbitrary';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import Random from '../../../../src/random/generator/Random';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';

class DummyArbitrary extends Arbitrary<{ key: number }> {
  constructor(public value: () => number) {
    super();
  }
  generate(mrng: Random): Shrinkable<{ key: number }> {
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

    describe('Given no length constraints', () => {
      genericHelper.testAlwaysCorrectValues(
        fc.constant(null),
        (maxLength: number) => array(new DummyArbitrary(() => 42)),
        (maxLength: number, g: { key: number }[]) => Array.isArray(g) && g.every(v => v.key === 42)
      );
    });
    describe('Given maximal length only', () => {
      genericHelper.testAlwaysCorrectValues(
        fc.nat(100),
        (maxLength: number) => array(new DummyArbitrary(() => 42), maxLength),
        (maxLength: number, g: { key: number }[]) =>
          Array.isArray(g) && g.length <= maxLength && g.every(v => v.key === 42)
      );
    });
    describe('Given minimal and maximal lengths', () => {
      genericHelper.testAlwaysCorrectValues(
        genericHelper.minMax(fc.nat(100)),
        (constraints: { min: number; max: number }) =>
          array(new DummyArbitrary(() => 42), constraints.min, constraints.max),
        (constraints: { min: number; max: number }, g: { key: number }[]) =>
          Array.isArray(g) && g.length >= constraints.min && g.length <= constraints.max && g.every(v => v.key === 42)
      );
    });
  });
});
