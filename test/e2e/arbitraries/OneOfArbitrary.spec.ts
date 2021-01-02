import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`OneOfArbitrary (seed: ${seed})`, () => {
  describe('oneof', () => {
    it('Should one of the possible element', () => {
      const out = fc.check(
        fc.property(fc.oneof(fc.constant(42), fc.constant(5)), (v: number) => v === 42 || v === 5),
        {
          seed: seed,
        }
      );
      expect(out.failed).toBe(false);
    });
    it('Should shrink on the underlying arbitrary', () => {
      const out = fc.check(
        fc.property(
          fc.oneof(fc.integer(-10, -1), fc.integer(0, 9), fc.integer(10, 19), fc.integer(20, 29)),
          (v: number) => v < 14 || v >= 20
        ),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([14]);
    });
  });
});
