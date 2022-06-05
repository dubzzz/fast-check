import * as fc from '../../../src/fast-check';
import { seed } from '../seed';

describe(`Arbitrary (seed: ${seed})`, () => {
  describe('chain', () => {
    it('Should bias nothing', () => {
      const out = fc.check(
        fc.property(
          fc.nat().chain((c) => fc.tuple(fc.constant(c), fc.nat())),
          (v: [number, number]) => !(v[0] > 100 && v[1] > 100)
        ),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
    });
    it('Should bias source only', () => {
      const out = fc.check(
        fc.property(
          fc.nat().chain((c) => fc.tuple(fc.constant(c), fc.nat())),
          (v: [number, number]) => !(v[0] <= 100 && v[1] > 100)
        ),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
    });
    it('Should bias destination only', () => {
      const out = fc.check(
        fc.property(
          fc.nat().chain((c) => fc.tuple(fc.constant(c), fc.nat())),
          (v: [number, number]) => !(v[0] > 100 && v[1] <= 100)
        ),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
    });
    it('Should bias both source and destination', () => {
      const out = fc.check(
        fc.property(
          fc.nat().chain((c) => fc.tuple(fc.constant(c), fc.nat())),
          (v: [number, number]) => !(v[0] <= 100 && v[1] <= 100)
        ),
        // Number of runs has been artificially increased to reduce the flakiness of this test
        // The default (100) was not so bad, but from time to time it led to red runs in the CI
        { seed: seed, numRuns: 500 }
      );
      expect(out.failed).toBe(true);
    });
    it('Should shrink chain on source', () => {
      const out = fc.check(
        fc.property(
          fc.nat().chain((v) => fc.constant(v)),
          (v: number) => v < 1
        ),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([1]);
    });
    it('Should shrink chain on destination', () => {
      const out = fc.check(
        fc.property(
          fc.constant(42).chain((_v) => fc.nat()),
          (v: number) => v < 1
        ),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample).toEqual([1]);
    });
  });
});
