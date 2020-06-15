import * as fc from '../../../../lib/fast-check';

import { falsy } from '../../../../src/check/arbitrary/FalsyArbitrary';

import * as stubRng from '../../stubs/generators';

function isLiterallyNaN(value: any) {
  return typeof value === 'number' && isNaN(value);
}

describe('FalsyArbitrary', () => {
  describe('falsy', () => {
    it('Should always return a falsy value', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          const g = falsy().generate(mrng).value;
          return !g;
        })
      ));

    it('Should be able to produce all the falsy values', () =>
      fc.assert(
        fc.property(
          fc.anything().filter((v) => !v),
          fc.integer(),
          (falsyValue, seed) => {
            const mrng = stubRng.mutable.fastincrease(seed);
            const arb = falsy();
            for (let id = 0; id !== 10000; ++id) {
              const g = arb.generate(mrng).value;
              if (g === falsyValue || (isLiterallyNaN(g) && isLiterallyNaN(falsyValue))) return true;
            }
            return false;
          }
        )
      ));
  });
});
