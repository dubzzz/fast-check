import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';
import { dummy } from './TupleArbitrary.properties';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import { char } from '../../../../src/check/arbitrary/CharacterArbitrary';
import { genericTuple } from '../../../../src/check/arbitrary/TupleArbitrary';

import * as stubRng from '../../stubs/generators';
import * as genericHelper from './generic/GenericArbitraryHelper';

describe('TupleArbitrary', () => {
  describe('genericTuple', () => {
    it('Should generate the same tuple with the same random', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.integer()), (seed, ids) => {
          const arb = genericTuple(ids.map(i => dummy(i)));
          const mrng1 = stubRng.mutable.fastincrease(seed);
          const mrng2 = stubRng.mutable.fastincrease(seed);
          const g1 = arb.generate(mrng1).value;
          assert.ok(g1.every((v: string, idx: number) => v.startsWith(`key${ids[idx]}_`)));
          assert.deepEqual(arb.generate(mrng2).value, g1);
          return true;
        })
      ));
    it('Should shrink tuple within allowed values', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.integer()), (seed, ids) => {
          const arb = genericTuple(ids.map(i => dummy(i)));
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = arb.generate(mrng);
          return shrinkable
            .shrink()
            .every(s => s.value.every((vv: string, idx: number) => vv.startsWith(`key${ids[idx]}_`)));
        })
      ));
    it('Should not suggest input in tuple shrinked values', () =>
      fc.assert(
        fc.property(fc.integer(), fc.array(fc.integer()), (seed, ids) => {
          const arb = genericTuple(ids.map(i => dummy(i)));
          const mrng = stubRng.mutable.fastincrease(seed);
          const shrinkable = arb.generate(mrng);
          return shrinkable
            .shrink()
            .every(s => !s.value.every((vv: string, idx: number) => vv === shrinkable.value[idx]));
        })
      ));
    it('Should throw on null arbitrary', () =>
      assert.throws(() => genericTuple([dummy(1), dummy(2), (null as any) as Arbitrary<string>])));
    it('Should throw on invalid arbitrary', () =>
      assert.throws(() => genericTuple([dummy(1), dummy(2), <Arbitrary<any>>{}])));
    genericHelper.testNoImpactOfMutation(genericTuple([char(), char()]), tab => {
      for (let idx = 0; idx !== tab.length; ++idx) tab[idx] = '.';
    });
  });
});
