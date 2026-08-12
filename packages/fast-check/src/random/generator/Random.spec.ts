import { describe, it } from 'vitest';
import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';
import * as fc from 'fast-check';

import { Random } from './Random.js';

const MAX_SIZE = 2048;
describe('Random', () => {
  describe('nextInt', () => {
    it('Should produce values within the range', async () =>
      await fc.assert(
        fc.asyncProperty(fc.integer(), fc.integer(), fc.integer(), fc.nat(MAX_SIZE), (seed, a, b, num) => {
          const mrng = new Random(xorshift128plus(seed));
          const min = a < b ? a : b;
          const max = a < b ? b : a;
          for (let idx = 0; idx !== num; ++idx) {
            const v = mrng.nextInt(min, max);
            if (min > v || max < v) return false;
          }
          return true;
        }),
      ));
    it('Should produce the same sequences given same seeds', async () =>
      await fc.assert(
        fc.asyncProperty(fc.integer(), fc.nat(MAX_SIZE), (seed, num) => {
          const mrng1 = new Random(xorshift128plus(seed));
          const mrng2 = new Random(xorshift128plus(seed));
          for (let idx = 0; idx !== num; ++idx)
            if (mrng1.nextInt(-0x80000000, 0x7fffffff) !== mrng2.nextInt(-0x80000000, 0x7fffffff)) return false;
          return true;
        }),
      ));
  });
  describe('clone', () => {
    it('Should produce the same sequences', async () =>
      await fc.assert(
        fc.asyncProperty(fc.integer(), fc.nat(MAX_SIZE), (seed, num) => {
          const mrng1 = new Random(xorshift128plus(seed));
          const mrng2 = mrng1.clone();
          for (let idx = 0; idx !== num; ++idx)
            if (mrng1.nextInt(-0x80000000, 0x7fffffff) !== mrng2.nextInt(-0x80000000, 0x7fffffff)) return false;
          return true;
        }),
      ));
  });
});
