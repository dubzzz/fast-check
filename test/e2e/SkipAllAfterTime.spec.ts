import * as fc from '../../src/fast-check';

const seed = Date.now();
describe(`SkipAllAfterTime (seed: ${seed})`, () => {
  it('should skip as soon as delay expires and mark run as failed', () => {
    let numRuns = 0;
    const out = fc.check(
      fc.property(fc.integer(), _x => {
        ++numRuns;
        return true;
      }),
      { skipAllAfterTimeLimit: 0 }
    );
    expect(out.failed).toBe(true); // Not enough tests have been executed
    expect(out.numRuns).toBe(0);
    expect(out.numShrinks).toBe(0);
    expect(out.numSkips).toBe(10001); // maxSkipsPerRun(100) * numRuns(100) +1
    expect(numRuns).toBe(0); // Expired immediately (timeout = 0)
  });
});
