import { describe, expect, it } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';

describe(`TimeLimitPlugins (seed: ${seed})`, () => {
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
});
