import * as prand from 'pure-rand';
import * as fc from '../../../../lib/fast-check';

import { lorem } from '../../../../src/check/arbitrary/LoremArbitrary';
import { Random } from '../../../../src/random/generator/Random';

describe('LoremArbitrary', () => {
  describe('lorem', () => {
    it('Should generate the same text with the same random', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng1 = new Random(prand.xorshift128plus(seed));
          const mrng2 = new Random(prand.xorshift128plus(seed));
          const g1 = lorem().generate(mrng1).value;
          const g2 = lorem().generate(mrng2).value;
          expect(g1).toEqual(g2);
          return true;
        })
      ));
    it('Should generate words by default', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(0, 100), (seed, num) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const g = lorem(num).generate(mrng).value;
          return g.indexOf('.') === -1;
        })
      ));
    it('Should generate sentences when asked too', () =>
      fc.assert(
        fc.property(fc.integer(), seed => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const g = lorem(5, true).generate(mrng).value;
          return g.indexOf('.') !== -1;
        })
      ));
  });
});
