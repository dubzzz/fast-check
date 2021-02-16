import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`IntegerArbitrary (seed: ${seed})`, () => {
  describe('integer', () => {
    it('Should generate integer within the range', () => {
      const out = fc.check(
        fc.property(fc.integer({ min: -42, max: -10 }), (v: number) => -42 <= v && v <= -10),
        { seed: seed }
      );
      expect(out.failed).toBe(false);
    });
    it('Should shrink integer with strictly negative range', () => {
      const out = fc.check(
        fc.property(fc.integer({ min: -1000, max: -10 }), (v: number) => v > -100),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([-100]);
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
