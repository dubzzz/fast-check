import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`FunctionArbitrary (seed: ${seed})`, () => {
  describe('func', () => {
    it('Should be able to generate multiple values', () => {
      const out = fc.check(
        fc.property(fc.func(fc.nat()), fc.integer(), fc.integer(), (f, a, b) => f(a) === f(b)),
        {
          seed: seed,
        }
      );
      expect(out.failed).toBe(true);
    });
    it('Should print the values and corresponding outputs', () => {
      expect(() =>
        fc.assert(
          fc.property(fc.func(fc.nat()), (f) => {
            f(0, 8);
            f(42, 1);
            return false;
          }),
          { seed: seed }
        )
      ).toThrowError(/\[0,8\] => 0.*\[42,1\] => 0/s);
    });
  });
  describe('compareFunc', () => {
    it('Should be able to find equivalence between distinct values', () => {
      const out = fc.check(
        fc.property(fc.compareFunc(), fc.string(), fc.string(), (f, a, b) => {
          fc.pre(a !== b);
          return f(a, b) !== 0;
        }),
        {
          seed: seed,
          numRuns: 5000, // increased numRuns to remove flakiness
        }
      );
      expect(out.failed).toBe(true);
      const [f, a, b] = out.counterexample!;
      expect(f(a, b) === 0).toBe(true);
    });
  });
});
