import * as assert from 'assert';
import * as fc from '../../../../lib/fast-check';
import { dummy } from './TupleArbitrary.properties';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';
import { genericTuple } from '../../../../src/check/arbitrary/TupleArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';
import { array } from '../../../../lib/fast-check';

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
  });
});
