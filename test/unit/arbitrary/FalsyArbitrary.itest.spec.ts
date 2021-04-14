import * as fc from '../../../lib/fast-check';

import { falsy } from '../../../src/arbitrary/falsy';

import * as stubRng from '../stubs/generators';

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
  });
});
