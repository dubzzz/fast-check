import { seed } from './seed';
import * as fc from '../../src/fast-check';

describe(`IgnoreEqualValues (seed: ${seed})`, () => {
  it('should not run more than 4 times', () => {
    let numRuns = 0;
    const out = fc.check(
      fc.property(fc.boolean(), fc.boolean(), () => {
        ++numRuns;
        return true;
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
