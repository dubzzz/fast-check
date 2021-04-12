import * as prand from 'pure-rand';
import * as fc from '../../../lib/fast-check';

import { option } from '../../../src/arbitrary/option';
import { Random } from '../../../src/random/generator/Random';

import * as stubArb from '../stubs/arbitraries';
import * as stubRng from '../stubs/generators';

describe('OptionArbitrary', () => {
  describe('option', () => {
    it('Should produce null option on default freq value', () =>
      fc.assert(
        fc.property(fc.integer(), (seed) => {
          const MAX_GUESSES = 1000;
          const mrng = new Random(prand.xorshift128plus(seed));
          const arb = option(stubArb.forward());
          for (let idx = 0; idx != MAX_GUESSES; ++idx) {
            if (arb.generate(mrng).value == null) {
              return true;
            }
          }
          return false;
        })
      ));
    it('Should shrink towards null', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (seed, start) => {
          const mrng = stubRng.mutable.fastincrease(seed);
          let shrinkable = option(stubArb.withShrink(start)).generate(mrng);
          while (shrinkable.shrink().has((_) => true)[0]) {
            shrinkable = shrinkable.shrink().next().value;
          } // only check one shrink path
          return shrinkable.value === null;
        })
      ));
    it('Should shrink towards the custom nil value if any', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), (seed, start) => {
          const nil = Symbol();
          const mrng = stubRng.mutable.fastincrease(seed);
          let shrinkable = option(stubArb.withShrink(start), { nil }).generate(mrng);
          while (shrinkable.shrink().has((_) => true)[0]) {
            shrinkable = shrinkable.shrink().next().value;
          } // only check one shrink path
          return shrinkable.value === nil;
        })
      ));
  });
});
