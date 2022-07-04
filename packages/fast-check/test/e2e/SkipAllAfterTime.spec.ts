import * as fc from '../../src/fast-check';
import { seed } from './seed';

describe(`SkipAllAfterTime (seed: ${seed})`, () => {
  it('should skip as soon as delay expires and mark run as failed', () => {
    let numRuns = 0;
    const out = fc.check(
      fc.property(fc.integer(), (_x) => {
        ++numRuns;
        return true;
      }),
      { skipAllAfterTimeLimit: 0 }
    );
    expect(out.failed).toBe(true); // Not enough tests have been executed
    expect(out.interrupted).toBe(false);
    expect(out.numRuns).toBe(0);
    expect(out.numShrinks).toBe(0);
    expect(out.numSkips).toBe(10001); // maxSkipsPerRun(100) * numRuns(100) +1
    expect(numRuns).toBe(0); // Expired immediately (timeout = 0)
  });
  it('should interrupt as soon as delay expires and mark run as success (no failure before)', () => {
    let numRuns = 0;
    const out = fc.check(
      fc.property(fc.integer(), (_n) => {
        ++numRuns;
        return true;
      }),
      { interruptAfterTimeLimit: 0 }
    );
    expect(out.failed).toBe(false); // No failure received before interrupt signal
    expect(out.interrupted).toBe(true);
    expect(out.numRuns).toBe(0);
    expect(out.numShrinks).toBe(0);
    expect(out.numSkips).toBe(0);
    expect(numRuns).toBe(0); // Expired immediately (timeout = 0)
  });
  it('should interrupt as soon as delay expires and mark run as failure if asked to', () => {
    let numRuns = 0;
    const out = fc.check(
      fc.property(fc.integer(), (_n) => {
        ++numRuns;
        return true;
      }),
      { interruptAfterTimeLimit: 0, markInterruptAsFailure: true }
    );
    expect(out.failed).toBe(true); // No failure received before interrupt signal
    expect(out.interrupted).toBe(true);
    expect(out.numRuns).toBe(0);
    expect(out.numShrinks).toBe(0);
    expect(out.numSkips).toBe(0);
    expect(numRuns).toBe(0); // Expired immediately (timeout = 0)
  });
  it('should consider interrupt with higer priority than skip', () => {
    let numRuns = 0;
    const out = fc.check(
      fc.property(fc.integer(), (_n) => {
        ++numRuns;
        return true;
      }),
      { interruptAfterTimeLimit: 0, skipAllAfterTimeLimit: 0 }
    );
    expect(out.failed).toBe(false); // No failure received before interrupt signal
    expect(out.interrupted).toBe(true);
    expect(out.numRuns).toBe(0);
    expect(out.numShrinks).toBe(0);
    expect(out.numSkips).toBe(0);
    expect(numRuns).toBe(0); // Expired immediately (timeout = 0)
  });
});
