import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';
import { dummy } from './TupleArbitrary.properties';

import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { context } from '../../../../src/check/arbitrary/ContextArbitrary';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import { genericTuple } from '../../../../src/check/arbitrary/TupleArbitrary';
import { Shrinkable } from '../../../../src/check/arbitrary/definition/Shrinkable';
import { hasCloneMethod, cloneMethod } from '../../../../src/check/symbols';

import * as genericHelper from './generic/GenericArbitraryHelper';
import * as stubRng from '../../stubs/generators';

describe('TupleArbitrary', () => {
  describe('genericTuple', () => {
    genericHelper.isValidArbitrary((mins: number[]) => genericTuple(mins.map(m => integer(m, m + 10))), {
      seedGenerator: fc.array(fc.nat(1000)),
      isStrictlySmallerValue: (g1: number[], g2: number[]) => g1.findIndex((v, idx) => v < g2[idx]) !== -1,
      isValidValue: (g: number[], mins: number[]) => {
        // right size
        if (g.length !== mins.length) return false;
        // values in the right range
        for (let idx = 0; idx !== g.length; ++idx) {
          if (g[idx] < mins[idx]) return false;
          if (g[idx] > mins[idx] + 10) return false;
        }
        return true;
      }
    });
    it('Should throw on null arbitrary', () =>
      assert.throws(() => genericTuple([dummy(1), dummy(2), (null as any) as Arbitrary<string>])));
    it('Should throw on invalid arbitrary', () =>
      assert.throws(() => genericTuple([dummy(1), dummy(2), <Arbitrary<any>>{}])));
    it('Should produce cloneable tuple if one cloneable children', () =>
      fc.assert(
        fc.property(fc.nat(50), fc.nat(50), (before, after) => {
          const arbsBefore = [...Array(before)].map(() => integer(0, 0));
          const arbsAfter = [...Array(before)].map(() => integer(0, 0));
          const arbs: Arbitrary<unknown>[] = [...arbsBefore, context(), ...arbsAfter];
          const mrng = stubRng.mutable.counter(0);
          const g = genericTuple(arbs).generate(mrng).value;
          return hasCloneMethod(g);
        })
      ));
    it('Should not produce cloneable tuple if no cloneable children', () =>
      fc.assert(
        fc.property(fc.nat(100), num => {
          const arbs = [...Array(num)].map(() => integer(0, 0));
          const mrng = stubRng.mutable.counter(0);
          const g = genericTuple(arbs).generate(mrng).value;
          return !hasCloneMethod(g);
        })
      ));
    it('Should not clone on generate', () => {
      let numCallsToClone = 0;
      const withClonedAndCounter = new class extends Arbitrary<any> {
        generate() {
          const v = {
            [cloneMethod]: () => {
              ++numCallsToClone;
              return v;
            }
          };
          return new Shrinkable(v);
        }
      }();
      const arbs = [withClonedAndCounter];
      const mrng = stubRng.mutable.counter(0);
      genericTuple(arbs).generate(mrng);
      return numCallsToClone === 0;
    });
  });
});
