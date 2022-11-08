import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`AutoArbitrary (seed: ${seed})`, () => {
  describe('auto', () => {
    it('should be able to shrink a single arbitrary', () => {
      const integerArb = fc.integer();
      const out = fc.check(
        fc.property(fc.auto(), (auto) => {
          const v1 = auto.builder(integerArb);
          expect(v1).toBeLessThanOrEqual(10);
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0].values()).toEqual([11]);
    });

    it('should be able to shrink two unrelated arbitraries', () => {
      const natArb = fc.nat();
      const out = fc.check(
        fc.property(fc.auto(), (auto) => {
          const v1 = auto.builder(natArb);
          const v2 = auto.builder(natArb); // unrelated because does not depend on v1
          expect(v1).toBeLessThanOrEqual(v2);
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![0].values()).toEqual([1, 0]);
    });
  });
});
