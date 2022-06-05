import { seed } from './seed';
import * as fc from '../../src/fast-check';

describe(`IgnoreEqualValues (seed: ${seed})`, () => {
  describe('ignoreEqualValues', () => {
    it('should not run more than 4 times', () => {
      let numRuns = 0;
      const out = fc.check(
        fc.property(fc.boolean(), fc.boolean(), () => {
          ++numRuns;
        }),
        { ignoreEqualValues: true }
      );
      expect(out.failed).toBe(false);
      expect(out.interrupted).toBe(false);
      expect(out.numRuns).toBe(100);
      expect(out.numShrinks).toBe(0);
      expect(out.numSkips).toBe(0);
      expect(numRuns).toBeLessThanOrEqual(4);
    });
  });

  describe('skipEqualValues', () => {
    it('should not run more than 4 times but mark run as failed due to too many skipped values', () => {
      let numRuns = 0;
      const out = fc.check(
        fc.property(fc.boolean(), fc.boolean(), () => {
          ++numRuns;
        }),
        { skipEqualValues: true }
      );
      expect(out.failed).toBe(true);
      expect(out.interrupted).toBe(false);
      expect(out.numRuns).toBe(4);
      expect(out.numShrinks).toBe(0);
      expect(out.numSkips).not.toBe(0);
      expect(numRuns).toBeLessThanOrEqual(4);
    });
  });
});
