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
          fc.oneof(
            fc.integer({ min: -10, max: -1 }),
            fc.integer({ min: 0, max: 9 }),
            fc.integer({ min: 10, max: 19 }),
            fc.integer({ min: 20, max: 29 })
          ),
          (v: number) => v < 14 || v >= 20
        ),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([14]);
    });
  });
});
