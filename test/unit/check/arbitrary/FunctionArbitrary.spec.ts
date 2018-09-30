import * as fc from '../../../../lib/fast-check';

import { func } from '../../../../src/check/arbitrary/FunctionArbitrary';
import { integer } from '../../../../src/check/arbitrary/IntegerArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

import * as stubRng from '../../stubs/generators';

describe('FunctionArbitrary', () => {
  describe('func', () => {
    it('Should return the same value given the same input', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (seed, a) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const f = func(integer()).generate(mrng).value;
          return f(a) === f(a);
        })
      ));
    it('Should not depend on the ordering of calls', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.integer(), (seed, a, b) => {
          const mrng1 = stubRng.mutable.fastincrease(seed);
          const f1 = func(integer()).generate(mrng1).value;
          const va1 = f1(a);
          const vb1 = f1(b);
          const mrng2 = stubRng.mutable.fastincrease(seed);
          const f2 = func(integer()).generate(mrng2).value;
          const vb2 = f2(b);
          const va2 = f2(a);
          return va1 === va2 && vb1 === vb2;
        })
      ));
    describe('Is valid arbitrary', () => {
      genericHelper.isValidArbitrary(() => func<[number, number], number>(integer()), {
        isEqual: (f1, f2) => f1(0, 42) === f2(0, 42),
        isValidValue: f => typeof f === 'function' && typeof f(0, 0) === 'number'
      });
    });
  });
});
