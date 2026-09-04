import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';

describe(`TimeLimitPlugins (seed: ${seed})`, () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should interrupt long runs with the interruptAfterTimeLimit plugin', async () => {
    // Arrange / Act
    const out = await fc.check(
      fc.asyncProperty(fc.integer(), async (_x) => {
        return new Promise<boolean>(() => {}); // never ending predicate
      }),
      { plugins: [fc.interruptAfterTimeLimit(10)] },
    );

    // Assert
    expect(out.interrupted).toBe(true);
  });

  it('should leave synchronous runs untouched when started within the time limit', () => {
    // Arrange / Act
    const out = fc.check(
      fc.property(fc.integer(), (_x) => true),
      { plugins: [fc.interruptAfterTimeLimit(60_000)] },
    );

    // Assert
    expect(out.failed).toBe(false);
    expect(out.interrupted).toBe(false);
    expect(out.numRuns).toBe(100);
  });

  it('should interrupt synchronous runs started after the time limit', () => {
    // Arrange / Act
    const out = fc.check(
      fc.property(fc.integer(), (_x) => true),
      { plugins: [fc.interruptAfterTimeLimit(0)] },
    );

    // Assert
    expect(out.interrupted).toBe(true);
    expect(out.numRuns).toBe(0);
  });

  it('should interrupt synchronous runs started after the time limit but keep the ones started before', () => {
    // Arrange
    vi.useFakeTimers();
    const timeLimitMs = 20;
    let numCalls = 0;

    // Act
    const out = fc.check(
      fc.property(fc.integer(), (_x) => {
        ++numCalls;
        if (numCalls === 2) {
          // The time limit has been computed by the plugin before any run started and fake time only moves
          // when we ask for it: moving it by the time limit ensures the next run starts exactly at the limit
          vi.advanceTimersByTime(timeLimitMs);
        }
        return true;
      }),
      { plugins: [fc.interruptAfterTimeLimit(timeLimitMs)] },
    );

    // Assert
    expect(out.interrupted).toBe(true);
    expect(out.numRuns).toBe(2);
    expect(numCalls).toBe(2);
  });
});
