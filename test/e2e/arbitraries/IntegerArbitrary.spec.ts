import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`IntegerArbitrary (seed: ${seed})`, () => {
  describe('integer', () => {
    it('Should generate integer within the range', () => {
      const out = fc.check(
        fc.property(fc.integer(-42, -10), (v: number) => -42 <= v && v <= -10),
        { seed: seed }
      );
      expect(out.failed).toBe(false);
    });
    it('Should shrink integer with strictly negative range', () => {
      const out = fc.check(
        fc.property(fc.integer(-1000, -10), (v: number) => v > -100),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([-100]);
    });
    it('Should shrink two integers up to the minimal failing case', () => {
      const out = fc.check(
        fc.property(fc.integer(), fc.integer(), (a: number, b: number) => {
          if (a < 1000) return true;
          if (b < 1000) return true;
          return Math.abs(a - b) < 10;
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      const [a, b] = out.counterexample!;
      const reorderedCounterexample = a < b ? [a, b] : [b, a];
      expect(reorderedCounterexample).toEqual([1000, 1010]);
    });
    it('Should shrink two integers up to the minimal failing case in a finite amount of time', () => {
      // In the past this specific scenario took a really long time
      // to reach the smaller failing case.
      // The problem was that the shrinker implemented for fc.integer
      // was not implementing a real dichotomy as it did not have enough
      // details to do so. It only knen that it shrunk once but not more.
      // It led some CI runs (of fast-check itself) to timeout after 6 hours.
      const out = fc.check(
        fc.property(fc.integer(), fc.integer(), (a: number, b: number) => {
          if (a < 1000) return true;
          if (b < 1000) return true;
          return Math.abs(a - b) >= 1000;
        }),
        { seed: seed, numRuns: 10000 }
      );
      expect(out.failed).toBe(true);
      const [a, b] = out.counterexample!;
      const reorderedCounterexample = a < b ? [a, b] : [b, a];
      expect(reorderedCounterexample).toEqual([1000, 1001]);
    });
  });
  describe('nat', () => {
    it('Should generate natural numbers', () => {
      const out = fc.check(
        fc.property(fc.nat(), (v: number) => v >= 0),
        { seed: seed }
      );
      expect(out.failed).toBe(false);
    });
    it('Should shrink natural number', () => {
      const out = fc.check(
        fc.property(fc.nat(), (v: number) => v < 100),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([100]);
    });
    it('Should detect overflow', () => {
      const out = fc.check(
        fc.property(
          fc.nat(Number.MAX_SAFE_INTEGER),
          fc.nat(Number.MAX_SAFE_INTEGER),
          (a: number, b: number) => a + b !== a + b + 1
        )
      );
      expect(out.failed).toBe(true);
    });
  });
});
