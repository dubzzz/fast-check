import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`TupleArbitrary (seed: ${seed})`, () => {
  describe('tuple', () => {
    it('Should shrink on tuple2', () => {
      const out = fc.check(
        fc.property(fc.tuple(fc.nat(), fc.nat()), (v: [number, number]) => v[0] < 100 || v[1] < 50),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([[100, 50]]);
    });
  });
});
