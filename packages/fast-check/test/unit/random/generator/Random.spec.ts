import * as prand from 'pure-rand';
import * as fc from '../../../../lib/fast-check';

import { Random } from '../../../../src/random/generator/Random';

const MAX_SIZE = 2048;
describe('Random', () => {
  describe('next', () => {
    it('Should produce values within 0 and 2 ** n - 1', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(31), fc.nat(MAX_SIZE), (seed, n, num) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          for (let idx = 0; idx !== num; ++idx) {
            const v = mrng.next(n);
            if (v < 0 || v > (((1 << n) - 1) | 0)) return false;
          }
          return true;
        })
      ));
  });
  describe('nextInt', () => {
    it('Should produce values within the range', () =>
      fc.assert(
        fc.property(fc.integer(), fc.integer(), fc.integer(), fc.nat(MAX_SIZE), (seed, a, b, num) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          const min = a < b ? a : b;
          const max = a < b ? b : a;
          for (let idx = 0; idx !== num; ++idx) {
            const v = mrng.nextInt(min, max);
            if (min > v || max < v) return false;
          }
          return true;
        })
      ));
    it('Should produce the same sequences given same seeds', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, num) => {
          const mrng1 = new Random(prand.xorshift128plus(seed));
          const mrng2 = new Random(prand.xorshift128plus(seed));
          for (let idx = 0; idx !== num; ++idx) if (mrng1.nextInt() !== mrng2.nextInt()) return false;
          return true;
        })
      ));
  });
  describe('nextDouble', () => {
    it('Should produce values within 0 and 1', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, num) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          for (let idx = 0; idx !== num; ++idx) {
            const v = mrng.nextDouble();
            if (v < 0 || v >= 1) return false;
          }
          return true;
        })
      ));
  });
  describe('clone', () => {
    it('Should produce the same sequences', () =>
      fc.assert(
        fc.property(fc.integer(), fc.nat(MAX_SIZE), (seed, num) => {
          const mrng1 = new Random(prand.xorshift128plus(seed));
          const mrng2 = mrng1.clone();
          for (let idx = 0; idx !== num; ++idx) if (mrng1.nextInt() !== mrng2.nextInt()) return false;
          return true;
        })
      ));
  });
});
