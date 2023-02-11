import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`Timeout (seed: ${seed})`, () => {
  it('should always run beforeEach and afterEach even in case of timeout', async () => {
    let numRuns = 0;
    const beforeEach = jest.fn().mockResolvedValue(undefined);
    const afterEach = jest.fn().mockResolvedValue(undefined);
    const out = await fc.check(
      fc
        .asyncProperty(fc.integer().noShrink(), async (_x) => {
          ++numRuns;
          await new Promise(() => {}); // never ending promise
        })
        .beforeEach(beforeEach)
        .afterEach(afterEach),
      { timeout: 0 }
    );
    expect(out.failed).toBe(true);
    expect(out.interrupted).toBe(false);
    expect(out.numRuns).toBe(1); // only once, it timeouts on first run and then shrink (no-shrink here)
    expect(out.numShrinks).toBe(0);
    expect(out.numSkips).toBe(0);
    expect(numRuns).toBe(1);
    expect(beforeEach).toHaveBeenCalledTimes(1);
    expect(afterEach).toHaveBeenCalledTimes(1);
  });
});
