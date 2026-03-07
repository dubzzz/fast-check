import { describe, it } from 'vitest';
import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import * as fc from 'fast-check';

import { createRandom, nextInt } from '../../../../src/random/generator/Random.js';

const MAX_SIZE = 2048;
describe('Random', () => {
  describe('nextInt', () => {
    it('Should produce values within the range', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.integer(), fc.nat(MAX_SIZE), (seed, a, b, num) => {
          const mrng = createRandom(xorshift128plus(seed));
          const min = a < b ? a : b;
          const max = a < b ? b : a;
          for (let idx = 0; idx !== num; ++idx) {
            const v = nextInt(mrng, min, max);
            if (min > v || max < v) return false;
          }
          return true;
        }),
      ));
    it('Should produce the same sequences given same seeds', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, num) => {
          const mrng1 = createRandom(xorshift128plus(seed));
          const mrng2 = createRandom(xorshift128plus(seed));
          for (let idx = 0; idx !== num; ++idx)
            if (nextInt(mrng1, -0x80000000, 0x7fffffff) !== nextInt(mrng2, -0x80000000, 0x7fffffff)) return false;
          return true;
        }),
      ));
  });
  describe('clone', () => {
    it('Should produce the same sequences', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, num) => {
          const mrng1 = createRandom(xorshift128plus(seed));
          const mrng2 = mrng1.clone();
          for (let idx = 0; idx !== num; ++idx)
            if (nextInt(mrng1, -0x80000000, 0x7fffffff) !== nextInt(mrng2, -0x80000000, 0x7fffffff)) return false;
          return true;
        }),
      ));
  });
});
